import crypto from 'crypto';
import { VerificationResult } from '@/domain/types/security';

/**
 * Service to handle Meta-specific security operations.
 * Primarily used for webhook signature verification and hub verification.
 */
export class MetaSecurityService {
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor() {
    this.appSecret = process.env.META_APP_SECRET || '';
    this.verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || '';

    // Warning instead of throw to allow the app to boot even if envs are missing
    // (though critical features will fail if called)
    if (!this.appSecret || !this.verifyToken) {
      console.warn('[MetaSecurityService] WARNING: Missing META_APP_SECRET or META_WEBHOOK_VERIFY_TOKEN');
    }
  }

  /**
   * Verifies the hub token for Meta webhook subscription (GET request).
   * Reference: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
   */
  verifyHubToken(token: string): boolean {
    if (!this.verifyToken) return false;
    return token === this.verifyToken;
  }

  /**
   * Verifies the X-Hub-Signature-256 header for incoming webhook events (POST request).
   * X-Hub-Signature-256 is the HMAC-SHA256 signature of the request payload, 
   * using the app secret as the key.
   * 
   * @param payload The RAW request body string
   * @param signature The X-Hub-Signature-256 header value (e.g., "sha256=...")
   */
  verifySignature(payload: string, signature: string): VerificationResult {
    try {
      if (!this.appSecret) {
        return { data: false, error: 'APP_SECRET_NOT_CONFIGURED' };
      }

      if (!signature) {
        return { data: false, error: 'MISSING_SIGNATURE' };
      }

      // 1. Meta signatures are prefixed with 'sha256='
      if (!signature.startsWith('sha256=')) {
        return { data: false, error: 'INVALID_SIGNATURE_FORMAT' };
      }

      const expectedSignature = signature.slice(7); // Remove 'sha256='
      
      // 2. Compute HMAC-SHA256
      const hmac = crypto.createHmac('sha256', this.appSecret);
      const actualSignature = hmac.update(payload, 'utf8').digest('hex');

      // 3. Timing-safe comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const actualBuffer = Buffer.from(actualSignature, 'hex');

      // Buffers must have equal length for timingSafeEqual
      if (expectedBuffer.length !== actualBuffer.length) {
        return { data: false, error: 'SIGNATURE_MISMATCH' };
      }

      const isValid = crypto.timingSafeEqual(actualBuffer, expectedBuffer);

      if (!isValid) {
        return { data: false, error: 'SIGNATURE_MISMATCH' };
      }

      return { data: true, error: null };
    } catch (err) {
      console.error('[MetaSecurityService] Signature verification error:', err);
      return { data: false, error: 'VERIFICATION_INTERNAL_ERROR' };
    }
  }
}

// Singleton helper
let instance: MetaSecurityService | null = null;

export function getMetaSecurityService() {
  if (!instance) {
    instance = new MetaSecurityService();
  }
  return instance;
}
