import { spawn } from 'child_process';

const __fetchAdHostsData = async () => {
    const LDAP_COMMAND = `${process.env.LDAP_COMMAND}`;
    try {
        return await new Promise((resolve, reject) => {
    
            const parts = LDAP_COMMAND.split(' ').filter(Boolean);
            const cmd = parts[0];
            const args = parts.slice(1);
    
            const child = spawn(cmd, args, { shell: true });
    
            let stdoutData = '';
            let stderrData = '';
    
            child.stdout.on('data', (data) => { stdoutData += data.toString(); });
            child.stderr.on('data', (data) => { stderrData += data.toString(); });
    
            child.on('error', reject);
    
            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`LDAP command failed with code ${code}: ${stderrData}`));
                } else {
                    if (stderrData) {
                        console.error(`LDAP command stderr: ${stderrData}`);
                    }
                    resolve(stdoutData);
                }
            });
        });
        
    } catch (error) {
        console.log("---------ERROR WHILE FETCHING AD HOSTS--------", error);
    }
}

function convertADTimeToIST(adTime) {
    if (!adTime) return null;

    // Extract parts
    const year = adTime.substring(0, 4);
    const month = adTime.substring(4, 6);
    const day = adTime.substring(6, 8);
    const hour = adTime.substring(8, 10);
    const minute = adTime.substring(10, 12);
    const second = adTime.substring(12, 14);

    // Create UTC date
    const utcDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);

    // Convert to IST
    return utcDate.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
    });
}

const __parseAdHostsData = (hostsData) => {
    try {
        const parsedHosts = hostsData.split('\n\n')
        .filter(block => block.includes('objectClass: computer'))
        .map(computer => {
            const lines = computer.split('\n');
            const computerData = {};
            lines.forEach((line) => {
                if (line.startsWith('dn:'))
                    computerData.distinguished_name = line.split('dn: ')[1];
                if (line.startsWith('cn:'))
                    computerData.computer_name = line.split('cn: ')[1];
                if (line.startsWith('operatingSystem:'))
                    computerData.operating_system = line.split('operatingSystem: ')[1];
                if (line.startsWith('operatingSystemVersion:'))
                    computerData.operating_system_version = line.split('operatingSystemVersion: ')[1];
                if (line.startsWith('dNSHostName:'))
                    computerData.dns_host_name = line.split('dNSHostName: ')[1];
                if (line.startsWith('whenCreated:'))
                    computerData.created_at = convertADTimeToIST(line.split('whenCreated: ')[1]);
                if (line.startsWith('whenChanged:'))
                    computerData.updated_at = convertADTimeToIST(line.split('whenChanged: ')[1]);
            });

            computerData.source = 'AD';
            return computerData;
        })
        .filter(computer => computer.computer_name && computer.distinguished_name);

        return parsedHosts;
    } catch (error) {
        console.log("---------ERROR WHILE PARSING AD HOSTS--------", error);
    }

}

export const AssetSyncAdFunction = async () => {
    try {
        const hostsData = await __fetchAdHostsData();

        const parsedHosts = __parseAdHostsData(hostsData);
        
        console.log("---------PARSED HOSTS--------", parsedHosts[0]);
        if (parsedHosts.length > 0) {
            const BATCH_SIZE = 100;

            await processBatches(parsedHosts, BATCH_SIZE, async (batch) => {
                const columns = ['computer_name', 'distinguished_name', 'operating_system', 'operating_system_version', 'dns_host_name', 'created_at', 'modified_at', 'source'];
                const values = [];
                const placeholders = [];

                batch.forEach((computer, index) => {
                    const baseIndex = index * columns.length;
                    const computerValues = [
                        computer.computer_name,
                        computer.distinguished_name,
                        computer.operating_system,
                        computer.operating_system_version,
                        computer.dns_host_name,
                        computer.created_at,
                        computer.modified_at,
                        "AD"
                    ];
                    values.push(...computerValues);

                    const rowPlaceholders = computerValues.map((_, colIndex) => `$${baseIndex + colIndex + 1}`);
                    placeholders.push(`(${rowPlaceholders.join(', ')})`);
                });

                // Preserve OS info collected from package sync (Linux hosts)
                // COALESCE keeps existing value if not null, preventing AD sync from overwriting
                // OS data collected during linux_package_sync operations
                const insertQuery = `
            INSERT INTO ad_hosts (${columns.join(', ')})
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (distinguished_name) DO UPDATE SET
              computer_name = EXCLUDED.computer_name,
              operating_system = COALESCE(ad_hosts.operating_system, EXCLUDED.operating_system),
              operating_system_version = COALESCE(ad_hosts.operating_system_version, EXCLUDED.operating_system_version),
              dns_host_name = EXCLUDED.dns_host_name,
              modified_at = NOW()
          `;

                return await query(insertQuery, values, { isWrite: true });
            });

            console.log(`Successfully processed all ${parsedComputers.length} AD computers in batches`);
        }

        // Get existing hosts
        const res2 = await query('SELECT id, computer_name FROM ad_hosts;', [], { isWrite: false });
        const existingHosts = res2.rows;

        // Find hosts to delete (hosts that exist in DB but not in current AD fetch)
        const hostsToDelete = existingHosts
            .filter(host => !parsedComputers.some(item => item.computer_name === host.computer_name));

        // Bulk delete using proper SQL with IN clause
        // if (hostsToDelete.length > 0) {
        //     const computerNames = hostsToDelete.map(host => host.computer_name);
        //     const placeholders = computerNames.map((_, index) => `$${index + 1}`).join(', ');

        //     const deleteQuery = `
        //   DELETE FROM ad_hosts 
        //   WHERE computer_name IN (${placeholders}) 
        //   AND source = 'AD'
        // `;

        //     console.log(`Deleting ${hostsToDelete.length} obsolete AD computers`);
        //     await query(deleteQuery, computerNames, { isWrite: true });
        // }

        return parsedComputers;

    } catch (err) {
        console.log("error in fetching ad host data", err);
    }
};