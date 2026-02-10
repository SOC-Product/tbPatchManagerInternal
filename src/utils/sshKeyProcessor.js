import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const processAndSaveSSHKey = async (sshKeyFile, hostId) => {
    const SSH_KEYS_DIR = '/opt/ssh_keys';
    
    try {
      // Ensure the directory exists
      await fs.mkdir(SSH_KEYS_DIR, { recursive: true, mode: 0o700 });
      
      // Get file extension
      const fileExt = path.extname(sshKeyFile.originalname).toLowerCase();
      
      // Validate file extension
      if (fileExt !== '.ppk' && fileExt !== '.pem') {
        throw new Error('Only .ppk and .pem files are supported');
      }
      
      // Read the file content to detect actual format
      const fileContent = sshKeyFile.buffer.toString('utf8');
      const isOpenSSHFormat = fileContent.includes('-----BEGIN OPENSSH PRIVATE KEY-----') || 
                              fileContent.includes('-----BEGIN RSA PRIVATE KEY-----') ||
                              fileContent.includes('-----BEGIN EC PRIVATE KEY-----') ||
                              fileContent.includes('-----BEGIN DSA PRIVATE KEY-----') ||
                              fileContent.includes('-----BEGIN PRIVATE KEY-----');
      const isPuTTYFormat = fileContent.includes('PuTTY-User-Key-File');
      
      // Generate unique filename - always save as .pem
      const timestamp = Date.now();
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const finalPemFileName = `ssh_key_${timestamp}_${uniqueId}.pem`;
      const finalPemFilePath = path.join(SSH_KEYS_DIR, finalPemFileName);
      
      // Check if file is in OpenSSH format (regardless of extension)
      if (isOpenSSHFormat) {
        // File is already in OpenSSH/PEM format, save it directly as .pem
        console.log(`[SSH Key Upload] File is in OpenSSH format - saving directly as: ${finalPemFileName} for host ID: ${hostId}`);
        await fs.writeFile(finalPemFilePath, sshKeyFile.buffer);
        
        // Set proper permissions (readable only by owner)
        await fs.chmod(finalPemFilePath, 0o600);
        
        console.log(`[SSH Key Upload] SSH key saved successfully: ${finalPemFileName}`);
        return finalPemFileName;
        
      } else if (isPuTTYFormat) {
        // File is in PuTTY format, need to convert using puttygen
        console.log(`[SSH Key Upload] File is in PuTTY format - converting to OpenSSH format for host ID: ${hostId}`);
        const ppkFileName = `ssh_key_${timestamp}_${uniqueId}.ppk`;
        const ppkFilePath = path.join(SSH_KEYS_DIR, ppkFileName);
        
        // Save the uploaded .ppk file temporarily
        await fs.writeFile(ppkFilePath, sshKeyFile.buffer);
        
        // Convert .ppk to .pem using puttygen
        console.log(`[SSH Key Upload] Converting ${ppkFileName} to ${finalPemFileName}...`);
        try {
        const { stdout, stderr } = await execPromise(
          `puttygen "${ppkFilePath}" -O private-openssh -o "${finalPemFilePath}"`
        );
        
        if (stderr && !stderr.includes('warning')) {
            console.error('[SSH Key Upload] puttygen conversion error:', stderr);
          throw new Error(`Failed to convert .ppk to .pem: ${stderr}`);
        }
        
          console.log('[SSH Key Upload] Conversion successful');
        
        // Set proper permissions on the .pem file
        await fs.chmod(finalPemFilePath, 0o600);
        
        // Delete the temporary .ppk file
        await fs.unlink(ppkFilePath);
        
          console.log(`[SSH Key Upload] SSH key converted and saved successfully: ${finalPemFileName}`);
        return finalPemFileName;
        } catch (conversionError) {
          // Clean up temporary file if conversion failed
          try {
            await fs.unlink(ppkFilePath);
          } catch (unlinkError) {
            console.error('[SSH Key Upload] Failed to clean up temp file:', unlinkError);
          }
          throw conversionError;
        }
      } else {
        // Unknown format
        throw new Error('Unsupported key format. File must be in OpenSSH format (.pem) or PuTTY format (.ppk). Please ensure the file contains a valid SSH private key.');
      }
      
    } catch (error) {
      console.error('[SSH Key Upload] Error processing SSH key:', error);
      throw error;
    }
  };