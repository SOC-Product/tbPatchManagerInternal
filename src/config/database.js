import { Pool } from "pg";

const HOSTS = JSON.parse(process.env.PGHOST || "[]");

const DB_CONFIG = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT || 5432,
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 50,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
    allowExitOnIdle: false,
    application_name: 'tb-nac-backend'
};

const __isPrimary = async (pool) => {
    let client;
    try {
        client = await pool.connect();
        const res = await client.query("SELECT pg_is_in_recovery() AS is_recovery;");
        return !res.rows[0].is_recovery;
    } catch (err) {
        console.error(`------ERROR CHECKING PRIMARY STATUS FOR HOST ${pool.options.host}-----------`, err.message);
        return false;
    } finally {
        if (client) client.release();
    }
};

const __isHealthy = async (pool) => {
    let client;
    try {
        client = await pool.connect();
        await client.query("SELECT 1");
        return true;
    } catch (err) {
        console.log(`-------------POOL--------------`, pool);
        console.error(`------ERROR CHECKING HEALTH FOR HOST ${pool.options.host}-----------`, err.message);
        return false;
    } finally {
        if (client) client.release();
    }
};

const __createPool = async (host) => {
    const pool = new Pool({ ...DB_CONFIG, host });

    pool.on('error', (err) => { console.error(`----------POOL ERROR ON ${host}--------`, err.message); });

    pool.on('connect', (client) => {
        const statementTimeout = process.env.PG_STATEMENT_TIMEOUT || 60000;
        client.query(`SET statement_timeout = '${statementTimeout}ms'`).catch(err => {
            console.warn(`-------------FAILED TO SET STATEMENT TIMEOUT ON ${host}--------------------`, err.message);
        });
        client.query(`SET idle_in_transaction_session_timeout = '${statementTimeout}ms'`).catch(err => {
            console.warn(`-------------FAILED TO SET IDLE IN TRANSACTION SESSION TIMEOUT ON ${host}--------------------`, err.message);
        });
    });

    return pool;
}

let primaryDBPool = null;
let secondaryDBPool = null;

const getPrimaryDatabase = async () => {
    if (!primaryDBPool) {
        await updatePrimaryAndSecondary();
    }
    return primaryDBPool;
};

const getSecondaryDatabase = async () => {
    if (!secondaryDBPool) {
        // console.log("------SECONDARY DATABASE NOT AVAILABLE, USING PRIMARY DATABASE INSTEAD-----------");
        await updatePrimaryAndSecondary();
        return await getPrimaryDatabase();
    }
    return secondaryDBPool;
};

const pools = {};
const updatePrimaryAndSecondary = async () => {
    let newPrimary = null;
    let newSecondary = null;

    for (const host of HOSTS) {
        if (!pools[host]) {
            pools[host] = new Pool({ ...DB_CONFIG, host });
        }

        const pool = pools[host];

        const healthy = await __isHealthy(pool);
        if (!healthy) {
            console.error(`Host unhealthy: ${host}`);
            continue;
        }

        const isPrimary = await __isPrimary(pool);

        if (isPrimary && !newPrimary) {
            newPrimary = pool;
        } else if (!isPrimary && !newSecondary) {
            newSecondary = pool;
        }
    }

    if (HOSTS.length === 1) {
        newPrimary = pools[HOSTS[0]];
        newSecondary = null;
    }

    primaryDBPool = newPrimary;
    secondaryDBPool = newSecondary;
};


export const query = async (text, params = [], options = {}) => {
    const start = Date.now();
    const { isWrite = false } = options;

    let pool;
    let client;

    try {
        pool = isWrite ? await getPrimaryDatabase() : await getSecondaryDatabase();

        if (!pool) {
            throw new Error('Database pool is not available');
        }

        // For large operations, use a dedicated client to avoid connection pool exhaustion
        if (Array.isArray(params) && params.length > 100) {
            client = await pool.connect();
            const res = await client.query(text, params);
            
            client.release();
            return res;
            
        }

        // Normal query flow
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log slow queries
        if (duration > 1000) {
            console.warn(`Slow query detected: ${duration}ms`, {
                query: text.substring(0, 100) + '...',
                operation: isWrite ? 'write' : 'read'
            });
        }

        return res;

    } catch (error) {
        if (client) {
            client.release();
        }

        console.error('Query error', {
            text: text.substring(0, 200) + '...',
            error: error.message,
            operation: isWrite ? 'write' : 'read',
            paramCount: Array.isArray(params) ? params.length : 0
        });

        // For connection-related errors, try to refresh connections
        if (error.message.includes('too many clients') ||
            error.message.includes('connection') ||
            error.code === 'ECONNRESET') {

            console.info('------ATTEMPTING TO REFRESH DATABASE CONNECTIONS DUE TO CONNECTION ERROR-----------');
            await updatePrimaryAndSecondary();

            // Retry the query once after updating connections
            try {
                pool = isWrite ? await getPrimaryDatabase() : await getSecondaryDatabase();
                if (!pool) {
                    throw new Error('Database pool is still not available after refresh');
                }

                const res = await pool.query(text, params);
                console.info('------QUERY SUCCEEDED AFTER CONNECTION REFRESH-----------');
                return res;
            } catch (retryError) {
                console.error('------QUERY FAILED AFTER CONNECTION REFRESH-----------', {
                    error: retryError.message,
                    query: text.substring(0, 100) + '...'
                });
                throw retryError;
            }
        } else {
            throw error;
        }
    }
};