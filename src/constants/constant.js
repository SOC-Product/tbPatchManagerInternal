export const CONSTANT = {
    AD_SYNC_BATCH_SIZE: 100,

    MANUAL_HOST_COLUMNS: ['computer_name', 'type', 'criticality', 'status', 'location', 'owner', 'operating_system', 'ip', 'username', 'password', 'source'
      ],
  
    AD_SYNC_COLUMNS: [
        'computer_name', 
        'distinguished_name', 
        'operating_system', 
        'operating_system_version', 
        'dns_host_name', 
        'created_at', 
        'updated_at', 
        'source'
    ]
}