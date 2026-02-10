export const SCRIPT = {
  BEGIN_TRANSACTION: `BEGIN;`,
  COMMIT: `COMMIT;`,
  ROLLBACK: `ROLLBACK;`,

  INSERT_OR_UPDATE: (columns, placeholders) => `
    INSERT INTO hosts (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (distinguished_name) DO UPDATE SET
      computer_name = EXCLUDED.computer_name,
      operating_system = COALESCE(hosts.operating_system, EXCLUDED.operating_system),
      operating_system_version = COALESCE(hosts.operating_system_version, EXCLUDED.operating_system_version),
      dns_host_name = EXCLUDED.dns_host_name,
      updated_at = NOW()
  `,

  AD_SYNC_HOSTS: `SELECT id, computer_name FROM hosts WHERE source = 'AD';`,
  AD_SYNC_HOSTS_TO_DELETE: (placeholders) =>
    `DELETE FROM hosts WHERE source = 'AD' AND computer_name IN (${placeholders});`,

  GET_HOST_COUNT_BY_SEARCH: `SELECT COUNT(*) AS count FROM hosts 
    WHERE 
      computer_name ILIKE '%' || $1 || '%'
      OR owner ILIKE '%' || $1 || '%'
      OR operating_system ILIKE '%' || $1 || '%'
      OR source ILIKE '%' || $1 || '%'`,

  GET_HOSTS_BY_SEARCH: `SELECT computer_name AS name, id, 
      type, criticality, owner, status, operating_system,
      source, os_version, ssh_key_file AS ssh_key, ip,
      last_sync_time AS last_scanned_synced 
    FROM hosts 
    WHERE 
      computer_name ILIKE '%' || $1 || '%' 
      OR owner ILIKE '%' || $1 || '%' 
      OR operating_system ILIKE '%' || $1 || '%' 
      OR source ILIKE '%' || $1 || '%' 
    ORDER BY name ASC LIMIT $2 OFFSET $3`,

  CREATE_HOST: (fields, placeholders) => `
    INSERT INTO hosts (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
  `,

  UPDATE_HOST: (updateFields) => `
    UPDATE hosts
    SET ${updateFields.join(', ')}
    WHERE id = $${updateFields.length + 1}
  `,

  DELETE_HOST: `
    DELETE FROM hosts
    WHERE id = $1
  `,

  GET_HOST_BY_ID: `
    SELECT id, computer_name AS name, type, criticality, owner, status,
           operating_system, source, os_version, ssh_key_file AS ssh_key, ip,
           last_sync_time AS last_scanned_synced
    FROM hosts
    WHERE id = $1
  `,
  
  GET_HOST_KPI: `
  SELECT 
    COUNT(*) AS total_host,
    COUNT(*) FILTER (
      WHERE LOWER(status) = 'online'
    ) AS online,
    COUNT(*) FILTER (
      WHERE LOWER(status) = 'offline'
    ) AS offline,
    COUNT(*) FILTER (
      WHERE LOWER(patch_status) = 'critical'
    ) AS critical_patches
  FROM hosts;
  `,
  GET_GROUP_BY_NAME: `SELECT * FROM maintainance_group WHERE name = $1`,
  CREATE_GROUP: `INSERT INTO maintainance_group (name, risk_tolerance, description) VALUES ($1, $2, $3) RETURNING *`,

  CREATE_GROUP_ASSET_MAPPING: (placeholders) =>
    `INSERT INTO maintainance_group_host_mapping (maintainance_group_id, host_id) VALUES ${placeholders}`,

  GET_GROUP_COUNT_BY_SEARCH:
    `SELECT COUNT(*) AS count FROM maintainance_group 
      WHERE name ILIKE '%' || $1 || '%'
      OR risk_tolerance ILIKE '%' || $1 || '%'`,

  GET_GROUPS_BY_SEARCH: `
    SELECT * FROM maintainance_group 
    WHERE name ILIKE '%' || $1 || '%'
      OR risk_tolerance ILIKE '%' || $1 || '%'
    ORDER BY name ASC LIMIT $2 OFFSET $3
  `,

  GET_GROUP_BY_ID: `SELECT id FROM maintainance_group WHERE id = $1`,

  GET_GROUP_DETAIL_AND_ASSETS_BY_ID: `
    SELECT 
      m.id,
      m.name,
      m.risk_tolerance,
      m.description,
      COALESCE(ARRAY_AGG(mghm.host_id), '{}') AS assets
      FROM maintainance_group m
      LEFT JOIN maintainance_group_host_mapping mghm 
            ON mghm.maintainance_group_id = m.id
        WHERE m.id = $1
        GROUP BY m.id;
        `,
  DELETE_GROUP_ASSET_MAPPING: 
    ` DELETE FROM maintainance_group_host_mapping 
      WHERE maintainance_group_id = $1`,
  DELETE_GROUP: `DELETE FROM maintainance_group WHERE id = $1`,
  
  UPDATE_GROUP: `
    UPDATE maintainance_group 
    SET name = $2, risk_tolerance = $3, description = $4, updated_at = NOW() 
    WHERE id = $1
  `,

  GET_GROUP_ASSETS: `SELECT host_id FROM maintainance_group_host_mapping WHERE maintainance_group_id = $1`,
  DELETE_ASSETS: `
        DELETE FROM maintainance_group_host_mapping 
        WHERE 
        maintainance_group_id = $1 
        AND host_id = ANY($2);`,
  
  MAINTAINANCE_GROUP_KPI: 
      ` SELECT count(*), 
        SUM(CASE WHEN risk_tolerance='high' THEN 1 ELSE 0 END) AS CRITICAL 
        from maintainance_group;`,
  GET_ASSETS_IN_GROUP: 
      ` SELECT count(*) 
        from maintainance_group_host_mapping`,

  DELETE_GROUP: `
    DELETE FROM maintainance_group 
    WHERE id = $1
  `,

  UPDATE_GROUP: `
    UPDATE maintainance_group
    SET name = $2,
        risk_tolerance = $3,
        description = $4,
        updated_at = NOW()
    WHERE id = $1
  `,

  GET_GROUP_ASSETS: `
    SELECT host_id 
    FROM maintainance_group_host_mapping 
    WHERE maintainance_group_id = $1
  `,

  DELETE_ASSETS: `
    DELETE FROM maintainance_group_host_mapping 
    WHERE maintainance_group_id = $1 
    AND host_id = ANY($2);
  `,
};
