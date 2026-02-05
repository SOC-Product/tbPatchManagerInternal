

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

    // Base select for hosts listing API - only required fields (pagination/search added in service)
    GET_ALL_HOSTS: `
      SELECT
        computer_name AS name,
        type,
        criticality,
        owner,
        status,
        operating_system,
        0 AS vulnerabilities,
        source,
        last_sync_time AS last_scanned_synced
      FROM hosts
    `,
}