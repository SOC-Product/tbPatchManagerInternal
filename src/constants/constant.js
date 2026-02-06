export const CONSTANT = {
    AD_SYNC_BATCH_SIZE: 100,

    AD_SYNC_COLUMNS: ['computer_name', 'distinguished_name', 'operating_system', 'operating_system_version', 'dns_host_name', 'created_at', 'updated_at', 'source'],
    MANUAL_HOST_COLUMNS: { name: 'computer_name', type: 'type', criticality: 'criticality', status: 'status', location: 'location', owner: 'owner', os: 'operating_system', ip: 'ip', username: 'username', password: 'password', source: 'source'
      }
}