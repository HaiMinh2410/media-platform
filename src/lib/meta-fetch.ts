import { MetaApiResponse } from '@/domain/types/meta';
import { createSyncLog } from '@/infrastructure/repositories/analytics.repository';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';

interface MetaFetchOptions {
  maxRetries?: number;       // default 3
  baseDelayMs?: number;      // default 1000
  accountId?: string;        // for logging
  serviceName?: string;      // default 'meta-api'
}

/**
 * Standardized wrapper for Meta API calls with exponential backoff and logging.
 */
export async function metaFetch<T>(
  url: string,
  token: string,
  opts: MetaFetchOptions = {}
): Promise<MetaApiResponse<T>> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    accountId,
    serviceName = 'meta-api'
  } = opts;

  let attempt = 0;

  const execute = async (): Promise<MetaApiResponse<T>> => {
    try {
      const urlWithToken = new URL(url);
      urlWithToken.searchParams.append('access_token', token);

      const response = await fetch(urlWithToken.toString());
      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.error?.code?.toString() || data.error?.error_subcode?.toString();
        const errorMessage = data.error?.message || 'API_ERROR';
        const rawCode = data.error?.code;

        // Check for rate limit errors (Meta codes: 4, 17, 32, 613, etc.)
        const isRateLimit = [4, 17, 32, 613].includes(rawCode) || 
                            errorMessage.toLowerCase().includes('rate limit');

        // Check for auth/token errors (102, 190, 458, 459, 460, 463, 467, etc.)
        // 190 is the most common for expired tokens
        const isAuthError = [102, 190, 458, 459, 460, 463, 467].includes(rawCode);

        if (isAuthError && accountId) {
          console.error(`[metaFetch] Auth error ${rawCode} for account ${accountId}. Flagging for re-auth.`);
          const repo = getPlatformAccountRepository();
          await repo.updateReauthStatus(accountId, true);
          
          await createSyncLog({
            accountId,
            service: serviceName,
            status: 'failed',
            errorMessage: `AUTH_REQUIRED: ${errorMessage}`,
            errorCode
          });
        }

        if (isRateLimit && attempt < maxRetries) {
          attempt++;
          const delay = Math.pow(2, attempt) * baseDelayMs;
          
          console.warn(`[metaFetch] Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
          
          await createSyncLog({
            accountId,
            service: serviceName,
            status: 'rate_limited',
            errorMessage: `Attempt ${attempt}: ${errorMessage}`,
            errorCode
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          return execute();
        }

        return { 
          data: null, 
          error: errorMessage,
          details: data.error
        };
      }

      // Success logging
      if (accountId) {
        await createSyncLog({
          accountId,
          service: serviceName,
          status: 'success'
        });
      }

      return { data, error: null };
    } catch (err: any) {
      console.error(`[metaFetch] Network error:`, err);
      
      if (attempt < maxRetries) {
        attempt++;
        const delay = Math.pow(2, attempt) * baseDelayMs;
        await new Promise(resolve => setTimeout(resolve, delay));
        return execute();
      }

      return { data: null, error: 'NETWORK_ERROR', details: err };
    }
  };

  return execute();
}
