import { NextRequest, NextResponse } from 'next/server';
import { getMetaSecurityService } from '@/infrastructure/meta/meta-security.service';
import { webhookHandler } from '@/application/services/webhook-handler.service';
import { webhookIngestion } from '@/application/services/webhook-ingestion.service';

/**
 * Meta Webhook Endpoint
 * 
 * Handles both:
 * 1. GET: Hub Verification (used by Meta to confirm the endpoint is ours)
 * 2. POST: Webhook Events (receives messages, changes, etc.)
 * 
 * Reference: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Meta sends a GET request with 'hub.mode=subscribe' to verify the webhook
  if (mode === 'subscribe' && token) {
    const security = getMetaSecurityService();
    const isValid = security.verifyHubToken(token);

    if (isValid) {
      console.log('[MetaWebhook] Verification successful');
      // Must return the challenge string exactly as received
      return new NextResponse(challenge, { status: 200 });
    }
  }

  console.warn('[MetaWebhook] Verification failed: Invalid mode or token');
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const security = getMetaSecurityService();
    
    // 1. Get raw body for signature verification (required for HMAC-SHA256)
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // 2. Verify signature using APP_SECRET
    const { data: isValid, error: verifError } = security.verifySignature(rawBody, signature);

    if (!isValid) {
      console.error('[MetaWebhook] Signature verification failed:', verifError);
      // Return 401 Unauthorized for security
      return NextResponse.json({ error: 'Unauthorized', code: verifError }, { status: 401 });
    }

    // 3. Parse payload into JSON
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error('[MetaWebhook] Failed to parse JSON body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 4. Log event to database (PlatformEventLog)
    // We log some useful headers along with the payload
    const importantHeaders = {
      'x-hub-signature-256': signature,
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
    };

    // We await the logging to ensure data safety before confirming to Meta
    const { error: logError } = await webhookHandler.logEvent('meta', payload, importantHeaders);

    if (logError) {
      console.error('[MetaWebhook] RAW Event logging failed:', logError);
    }

    // 5. Ingest and Parse (Processed Log for easier debugging/ref)
    const { error: ingestError } = await webhookIngestion.ingestMeta(payload, importantHeaders);
    
    if (ingestError) {
      console.error('[MetaWebhook] PROCESSED Event ingestion failed:', ingestError);
    }

    // 6. Acknowledge receipt
    // Meta requires a 200 OK response to stop retrying
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('[MetaWebhook] Unexpected error in POST handler:', err);
    // Return 200 anyway to prevent Meta from flooding with retries during crashes
    // if we haven't logged the error yet. 
    // Actually, usually 500 is better for real crashes so we can see them in logs.
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
