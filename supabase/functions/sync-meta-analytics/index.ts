/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";

// Function definition
Deno.serve(async (req: Request) => {
  // We only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Get env vars
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const META_ENCRYPTION_KEY = Deno.env.get("META_ENCRYPTION_KEY") || Deno.env.get("META_TOKEN_ENCRYPTION_KEY");
  const META_APP_ID = Deno.env.get("META_APP_ID");
  const META_APP_SECRET = Deno.env.get("META_APP_SECRET");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !META_ENCRYPTION_KEY) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  function decryptToken(encrypted: string): string | null {
    try {
      const parts = encrypted.split(':');
      if (parts.length !== 3) return null;
      const [ivHex, authTagHex, ciphertextHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = Buffer.from(META_ENCRYPTION_KEY as string, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.error("Decrypt error", e);
      return null;
    }
  }

  try {
    // 1. Get all accounts with tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('meta_tokens')
      .select('account_id, encrypted_access_token');
      
    if (tokensError || !tokens) throw tokensError;

    const { data: accounts, error: accountsError } = await supabase
      .from('platform_accounts')
      .select('id, platform_user_id, platform');

    if (accountsError || !accounts) throw accountsError;

    let successCount = 0;
    const logs = [];

    // 2. Loop through and sync
    for (const token of tokens) {
      const account = accounts.find((a: any) => a.id === token.account_id);
      if (!account) continue;

      const accessToken = decryptToken(token.encrypted_access_token);
      if (!accessToken) {
        logs.push({ account_id: account.id, sync_type: 'auto', status: 'error', error_msg: 'Failed to decrypt token', records_synced: 0 });
        continue;
      }

      const externalId = account.platform_user_id;
      const platform = account.platform;
      
      try {
        let reach = 0;
        let impressions = 0;
        let engagement = 0;
        let followers = 0;

        const baseUrl = 'https://graph.facebook.com/v20.0';

        if (platform === 'facebook' || platform === 'meta') {
          // FB Insights
          const insightsRes = await fetch(`${baseUrl}/${externalId}/insights?metric=page_impressions_unique,page_post_engagements,page_impressions&period=day&access_token=${accessToken}`);
          const insightsData = await insightsRes.json();
          if (insightsData.data) {
            reach = insightsData.data.find((i: any) => i.name === 'page_impressions_unique')?.values[0]?.value || 0;
            impressions = insightsData.data.find((i: any) => i.name === 'page_impressions')?.values[0]?.value || 0;
            engagement = insightsData.data.find((i: any) => i.name === 'page_post_engagements')?.values[0]?.value || 0;
            if (reach === 0 && impressions > 0) reach = Math.floor(impressions * 0.8);
          }

          // FB Fans
          const fansRes = await fetch(`${baseUrl}/${externalId}?fields=fan_count&access_token=${accessToken}`);
          const fansData = await fansRes.json();
          followers = fansData.fan_count || 0;

        } else if (platform === 'instagram') {
          const insightsRes = await fetch(`${baseUrl}/${externalId}/insights?metric=impressions,reach,engagement&period=day&access_token=${accessToken}`);
          const insightsData = await insightsRes.json();
          if (insightsData.data) {
            impressions = insightsData.data.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;
            reach = insightsData.data.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
            engagement = insightsData.data.find((i: any) => i.name === 'engagement')?.values[0]?.value || 0;
          }

          const followersRes = await fetch(`${baseUrl}/${externalId}?fields=followers_count&access_token=${accessToken}`);
          const followersData = await followersRes.json();
          followers = followersData.followers_count || 0;
        }

        // Upsert analytics_snapshots
        const todayStr = new Date().toISOString().split('T')[0]; // UTC midnight equivalent for date type
        
        // Supabase JS doesn't have upsert with compound unique constraint natively without specifying onConflict
        const { error: upsertError } = await supabase
          .from('analytics_snapshots')
          .upsert({
            account_id: account.id,
            date: todayStr,
            reach,
            impressions,
            engagement,
            followers,
          }, { onConflict: 'account_id, date' });

        if (upsertError) throw upsertError;

        successCount++;
        logs.push({ account_id: account.id, sync_type: 'auto', status: 'success', error_msg: null, records_synced: 1 });

      } catch (err: any) {
        console.error(`Error syncing account ${account.id}:`, err);
        logs.push({ account_id: account.id, sync_type: 'auto', status: 'error', error_msg: err.message || 'Unknown error', records_synced: 0 });
      }

      // Rate limit: delay 1s
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Write logs
    if (logs.length > 0) {
      await supabase.from('sync_logs').insert(logs);
    }

    return new Response(JSON.stringify({ success: true, processed: logs.length, successful: successCount }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
