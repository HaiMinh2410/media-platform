import crypto from 'crypto';
import { DecryptResult } from '@/domain/types/crypto';

/**
 * Service to handle AES-256-GCM encryption/decryption for sensitive tokens.
 * Format: iv:authTag:ciphertext (all hex encoded)
 */
export class TokenEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY;
    
    if (!keyHex) {
      throw new Error('MISSING_ENCRYPTION_KEY: META_TOKEN_ENCRYPTION_KEY must be defined.');
    }

    // AES-256 requires 32 bytes. If hex string, it should be 64 characters.
    this.key = Buffer.from(keyHex, 'hex');
    
    if (this.key.length !== 32) {
      throw new Error('INVALID_ENCRYPTION_KEY: META_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters).');
    }
  }

  /**
   * Encrypts a string and returns it in the format: iv:authTag:ciphertext
   */
  async encrypt(text: string): Promise<{ data: string | null; error: string | null }> {
    try {
      // 1. Generate a random Initialization Vector (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // 2. Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // 3. Encrypt the text
      let ciphertext = cipher.update(text, 'utf8', 'hex');
      ciphertext += cipher.final('hex');

      // 4. Get the Authentication Tag (16 bytes for GCM)
      const authTag = cipher.getAuthTag().toString('hex');

      // 5. Combine into the final format
      const result = `${iv.toString('hex')}:${authTag}:${ciphertext}`;

      return { data: result, error: null };
    } catch (err) {
      console.error('[TokenEncryptionService] Encryption failed:', err);
      return { data: null, error: 'ENCRYPTION_FAILED' };
    }
  }

  /**
   * Decrypts a string formatted as: iv:authTag:ciphertext
   */
  async decrypt(encryptedString: string): Promise<DecryptResult> {
    try {
      const parts = encryptedString.split(':');
      if (parts.length !== 3) {
        return { data: null, error: 'INVALID_FORMAT' };
      }

      const [ivHex, authTagHex, ciphertextHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // 1. Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // 2. Decrypt
      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return { data: decrypted, error: null };
    } catch (err) {
      console.error('[TokenEncryptionService] Decryption failed:', err);
      return { data: null, error: 'DECRYPTION_FAILED' };
    }
  }
}

// Export a singleton instance
// Note: In some environments, you might want to instantiate this per request or use a factory
// but for our clean architecture, a singleton with env check is sufficient if configured.
let instance: TokenEncryptionService | null = null;

export function getTokenEncryptionService() {
  if (!instance) {
    try {
      instance = new TokenEncryptionService();
    } catch (err) {
      console.error('[TokenEncryptionService] Initialization failed:', err);
      // Return a dummy object or throw depending on how critical this is.
      // Here we throw because without the key, we cannot proceed with secure operations.
      throw err;
    }
  }
  return instance;
}
