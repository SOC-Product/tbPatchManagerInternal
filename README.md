# tbPatchManagerInternal

Internal backend migration service for patch management.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- SSL certificates (key.pem and cert.pem) for HTTPS mode

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following configuration:

```bash
# Server Configuration
PORT=9999
SERVER_TYPE=https
HOST=192.168.0.81

# SSL Certificate Paths
KEY_PATH=/root/key.pem
CERT_PATH=/root/cert.pem

# CORS Configuration
ALLOWED_ORIGINS=["192.168.0.81","https://192.168.0.26:9000","https://localhost:9000","https://192.168.0.81:9000","https://192.168.0.26:3000"]

# LDAP Configuration
LDAP_COMMAND=ldapsearch -x -H ldap://WIN-IRA9KARHUF.tech-bridge.biz -D "soctools@tech-bridge.biz" -w "Admin@123" -b "dc=tech-bridge,dc=biz" "(objectClass=computer)"

# PostgreSQL Database Configuration
# PGHOST should be a JSON array of database host addresses
PGHOST=["localhost"]
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=your_database_name
PGPORT=5432

# Database Connection Pool Configuration (Optional)
DB_MAX_CONNECTIONS=50
DB_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=10000
DB_ACQUIRE_TIMEOUT=30000
PG_STATEMENT_TIMEOUT=60000
```

**Quick Setup:**
```bash
cp env.example .env
# Then edit .env with your actual values
```

### 3. Ensure SSL Certificates Exist

Make sure your SSL certificates are available at the paths specified in `KEY_PATH` and `CERT_PATH`.

For HTTP mode (development), set `SERVER_TYPE=http` in your `.env` file.

## Running the Backend

### Start the Server

```bash
npm start
```

Or:

```bash
node index.js
```

### Development Mode

```bash
npm run dev
```

## Environment Variables Explained

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port number | No | 9999 |
| `SERVER_TYPE` | Server type: `http` or `https` | No | http |
| `HOST` | Server host address | No | - |
| `KEY_PATH` | Path to SSL private key file | Yes (if HTTPS) | - |
| `CERT_PATH` | Path to SSL certificate file | Yes (if HTTPS) | - |
| `ALLOWED_ORIGINS` | JSON array of allowed CORS origins | No | - |
| `LDAP_COMMAND` | LDAP search command | No | - |
| `PGHOST` | JSON array of PostgreSQL host addresses | Yes | [] |
| `PGUSER` | PostgreSQL username | Yes | - |
| `PGPASSWORD` | PostgreSQL password | Yes | - |
| `PGDATABASE` | PostgreSQL database name | Yes | - |
| `PGPORT` | PostgreSQL port | No | 5432 |
| `DB_MAX_CONNECTIONS` | Max database connections | No | 50 |
| `DB_IDLE_TIMEOUT` | Idle timeout in milliseconds | No | 60000 |
| `DB_CONNECTION_TIMEOUT` | Connection timeout in milliseconds | No | 10000 |
| `DB_ACQUIRE_TIMEOUT` | Acquire timeout in milliseconds | No | 30000 |
| `PG_STATEMENT_TIMEOUT` | Statement timeout in milliseconds | No | 60000 |

## Database Schema

The application automatically initializes the database schema on startup. The `hosts` table will be created if it doesn't exist.

## Notes

- The `.env` file is gitignored and should not be committed to version control
- For production, use environment variables or a secure secrets management system
- Ensure your PostgreSQL database is running and accessible before starting the server
- The server will automatically initialize the database schema on startup
