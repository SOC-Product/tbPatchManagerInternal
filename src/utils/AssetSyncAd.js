import { spawn } from 'child_process';
import { CONSTANT } from '../constants/constant.js';
import { SCRIPT } from '../constants/script.js';
import { query } from '../config/database.js';

function convertADTimeToUTC(adTime) {
    if (!adTime) return null;

    const year = adTime.substring(0, 4);
    const month = adTime.substring(4, 6);
    const day = adTime.substring(6, 8);
    const hour = adTime.substring(8, 10);
    const minute = adTime.substring(10, 12);
    const second = adTime.substring(12, 14);

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

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
                        computerData.created_at = convertADTimeToUTC(line.split('whenCreated: ')[1]);
                    if (line.startsWith('whenChanged:'))
                        computerData.updated_at = convertADTimeToUTC(line.split('whenChanged: ')[1]);
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

const __deleteHosts = async (hostsToDelete) => {
    try {
        const computerNames = hostsToDelete.map(host => host.computer_name);
        const placeholders = computerNames.map((_, index) => `$${index + 1}`).join(', ');

        await query(SCRIPT.AD_SYNC_HOSTS_TO_DELETE(placeholders), computerNames, { isWrite: true });
    } catch (error) {
        console.log("---------ERROR WHILE DELETING AD HOSTS--------", error);
    }
}

export const AssetSyncAdFunction = async () => {
    try {
        const hostsData = await __fetchAdHostsData();

        const parsedHosts = __parseAdHostsData(hostsData);

        const BATCH_SIZE = CONSTANT.AD_SYNC_BATCH_SIZE;
        const columns = CONSTANT.AD_SYNC_COLUMNS;

        if (parsedHosts.length > 0) {

            for (let i = 0; i < parsedHosts.length; i += BATCH_SIZE) {
                const batch = parsedHosts.slice(i, i + BATCH_SIZE);

                const values = [];
                const placeholders = [];

                batch.forEach((computer, index) => {
                    const baseIndex = index * columns.length;
                    const computerValues = columns.map((column, colIndex) => `$${baseIndex + colIndex + 1}`);
                    placeholders.push(`(${computerValues.join(', ')})`);
                    values.push(...columns.map(column => computer[column]));
                });

                await query(SCRIPT.INSERT_OR_UPDATE(columns, placeholders), values, { isWrite: true });
            }

            const existingHosts = (await query(SCRIPT.AD_SYNC_HOSTS, [], { isWrite: false })).rows;

            const hostsToDelete = existingHosts.filter(host => !parsedHosts.some(item => item.computer_name === host.computer_name));

            if (hostsToDelete.length > 0) {
                await __deleteHosts(hostsToDelete);
            }

        }
    } catch (err) {
        console.log("---------ERROR WHILE SYNCING AD HOSTS--------", err);
    }
}