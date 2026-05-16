// @ts-nocheck
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
        let profileVisits = 0;
        let profileLinksTaps = 0;
        let accountsReached = 0;
        let followersPct = 0;
        let nonfollowersPct = 0;
        let byContentViews: any = null;
        let byContentInteractions: any = null;
        let activeTimes: any = null;

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
          // A. Followers count first
          const followersRes = await fetch(`${baseUrl}/${externalId}?fields=followers_count&access_token=${accessToken}`);
          const followersData = await followersRes.json();
          followers = followersData.followers_count || 0;
          const insufficientData = followers < 100;

          // B. Parallel requests for IG
          const metricsPromises = [
            // 1. Core daily
            fetch(`${baseUrl}/${externalId}/insights?metric=reach,impressions,profile_links_taps&period=day&access_token=${accessToken}`).then(r => r.json()),
            // 2. Reach breakdown
            fetch(`${baseUrl}/${externalId}/insights?metric=reach&breakdown=follower_type&period=day&access_token=${accessToken}`).then(r => r.json()),
            // 3. Views breakdown
            fetch(`${baseUrl}/${externalId}/insights?metric=views&breakdown=media_product_type&period=day&access_token=${accessToken}`).then(r => r.json()),
            // 4. Media for aggregation
            fetch(`${baseUrl}/${externalId}/media?fields=id,media_type,like_count,comments_count,timestamp&limit=50&access_token=${accessToken}`).then(r => r.json())
          ];

          if (!insufficientData) {
            metricsPromises.push(
              fetch(`${baseUrl}/${externalId}/insights?metric=online_followers&period=lifetime&access_token=${accessToken}`).then(r => r.json())
            );
          }

          const [coreRes, reachBrRes, viewsBrRes, mediaRes, onlineRes] = await Promise.all(metricsPromises);

          // C. Process Core & Breakdowns
          if (coreRes.data) {
            reach = coreRes.data.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
            impressions = coreRes.data.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;
            profileLinksTaps = coreRes.data.find((i: any) => i.name === 'profile_links_taps')?.values[0]?.value || 0;
            accountsReached = reach;
          }

          if (reachBrRes.data) {
            const rVal = reachBrRes.data.find((i: any) => i.name === 'reach')?.values[0]?.value;
            if (rVal && typeof rVal === 'object') {
              const total = (rVal.follower || 0) + (rVal['non-follower'] || 0);
              if (total > 0) {
                followersPct = (rVal.follower || 0) / total;
                nonfollowersPct = (rVal['non-follower'] || 0) / total;
              }
            }
          }

          if (viewsBrRes.data) {
            const vVal = viewsBrRes.data.find((i: any) => i.name === 'views')?.values[0]?.value;
            if (vVal && typeof vVal === 'object') {
              byContentViews = {
                all: { posts: vVal.POST || 0, reels: vVal.REELS || 0, stories: vVal.STORY || 0 },
                followers: { posts: 0, reels: 0, stories: 0 },
                nonfollowers: { posts: 0, reels: 0, stories: 0 }
              };
            }
          }

          if (onlineRes && onlineRes.data) {
            activeTimes = onlineRes.data.find((i: any) => i.name === 'online_followers')?.values[0]?.value || null;
          }

          // D. Aggregation (Media Level)
          if (mediaRes.data) {
            let totalPV = 0;
            let postInt = 0, reelInt = 0, storyInt = 0;

            const mediaBatch = mediaRes.data.map(async (m: any) => {
              try {
                const mInsightsRes = await fetch(`${baseUrl}/${m.id}/insights?metric=reach,impressions,saved,shares,profile_visits&access_token=${accessToken}`);
                const mInsights = await mInsightsRes.json();
                if (mInsights.data) {
                  const pVisits = mInsights.data.find((i: any) => i.name === 'profile_visits')?.values[0]?.value || 0;
                  totalPV += pVisits;

                  const saved = mInsights.data.find((i: any) => i.name === 'saved')?.values[0]?.value || 0;
                  const shares = mInsights.data.find((i: any) => i.name === 'shares')?.values[0]?.value || 0;
                  const total = (m.like_count || 0) + (m.comments_count || 0) + saved + shares;

                  if (m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM') postInt += total;
                  else if (m.media_type === 'VIDEO' || m.media_type === 'REELS') reelInt += total;
                }
              } catch (e) { /* skip */ }
            });

            await Promise.allSettled(mediaBatch);
            profileVisits = totalPV;
            byContentInteractions = { posts: postInt, reels: reelInt, stories: storyInt };
          }
        }

        // Upsert analytics_snapshots
        const todayStr = new Date().toISOString().split('T')[0]; 
        
        const { error: upsertError } = await supabase
          .from('analytics_snapshots')
          .upsert({
            account_id: account.id,
            date: todayStr,
            reach,
            impressions,
            engagement,
            followers,
            profile_visits: profileVisits,
            profile_links_taps: profileLinksTaps,
            accounts_reached: accountsReached,
            followers_pct: followersPct,
            nonfollowers_pct: nonfollowersPct,
            by_content_views: byContentViews,
            by_content_interactions: byContentInteractions,
            active_times: activeTimes,
            insufficient_data: followers < 100
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
