import { query } from './database.js';

const schema = [
    `CREATE TABLE IF NOT EXISTS hosts (
        id SERIAL PRIMARY KEY,
        computer_name VARCHAR(255) NOT NULL,
        ip VARCHAR(255) UNIQUE,
        distinguished_name VARCHAR(255) UNIQUE,
        operating_system VARCHAR(255),
        operating_system_version VARCHAR(255),
        dns_host_name VARCHAR(255),
        type VARCHAR(255),
        criticality VARCHAR(255),
        location VARCHAR(255),
        owner VARCHAR(255),
        patch_status VARCHAR(255),
        username VARCHAR(255),
        password VARCHAR(255),
        ssh_key_file VARCHAR(255),
        source VARCHAR(50),
        status VARCHAR(255),
        os_type VARCHAR(255),
        os_version VARCHAR(255),
        os_release VARCHAR(255),
        os_family VARCHAR(255),
        is_sync BOOLEAN DEFAULT false,
        last_sync_time TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

    `
    CREATE TABLE IF NOT EXISTS maintainance_group (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        risk_tolerance VARCHAR(50) CHECK (risk_tolerance IN ('low', 'medium', 'high')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    `
    ,
    `
    CREATE TABLE IF NOT EXISTS maintainance_group_host_mapping (
        id SERIAL PRIMARY KEY,
        maintainance_group_id INT NOT NULL REFERENCES maintainance_group(id) ON DELETE CASCADE,
        host_id INT NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (maintainance_group_id, host_id)
    );
    `

];


export const initializeSchema = async () => {
    try {
        console.log('-----INITIALIZING DATABASE SCHEMA--------');
        for (let i = 0; i < schema.length; i++) {
            await query(schema[i], [], { isWrite: true });
        }
        console.log('-----DATABASE SCHEMA INITIALIZED SUCCESSFULLY--------');
    } catch (error) {
        console.error('-----ERROR INITIALIZING DATABASE SCHEMA--------', error);
        throw error;
    }
};