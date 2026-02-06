

export const SCRIPT = {

    INSERT_OR_UPDATE: (columns, placeholders) => `
      INSERT INTO hosts (${columns.join(', ')})
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (distinguished_name) DO UPDATE SET
        computer_name = EXCLUDED.computer_name,
        operating_system = COALESCE(hosts.operating_system, EXCLUDED.operating_system),
        operating_system_version = COALESCE(hosts.operating_system_version, EXCLUDED.operating_system_version),
        dns_host_name = EXCLUDED.dns_host_name,
        updated_at = NOW()
      `
    ,
    AD_SYNC_HOSTS: `SELECT id, computer_name FROM hosts WHERE source = 'AD';`,
    AD_SYNC_HOSTS_TO_DELETE: (placeholders) => `DELETE FROM hosts WHERE source = 'AD' AND computer_name IN (${placeholders});`,

    GET_HOST_COUNT_BY_SEARCH: `SELECT COUNT(*) AS count FROM hosts 
      WHERE 
      computer_name ILIKE '%' || $1 || '%'
      OR owner ILIKE '%' || $1 || '%'
      OR operating_system ILIKE '%' || $1 || '%'
      OR source ILIKE '%' || $1 || '%'`,
    GET_HOSTS_BY_SEARCH: `SELECT computer_name AS name, 
      type, criticality, 
      owner, 
      status, 
      operating_system,
      source, 
      last_sync_time AS last_scanned_synced FROM hosts 
      WHERE 
      computer_name ILIKE '%' || $1 || '%' 
      OR owner ILIKE '%' || $1 || '%' 
      OR operating_system ILIKE '%' || $1 || '%' 
      OR source ILIKE '%' || $1 || '%' 
      ORDER BY name ASC LIMIT $2 OFFSET $3`,

    CREATE_HOST: (fields, placeholders) => `
      INSERT INTO hosts (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING
        id, computer_name AS name, type, criticality, owner, status, operating_system, source, last_sync_time AS last_scanned_synced
    `,
  }