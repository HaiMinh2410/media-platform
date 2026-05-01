/**
 * Script: find-ig-for-sullybbi.ts
 * Tìm FB page nào link với IG account _sullybbi (17841477990850937)
 */
import crypto from 'crypto';

// Thử tất cả FB page tokens
const FB_PAGES = [
  { pageId: '1122137857642529', name: 'Kathryn', token: 'EABAX69avEfIBRVYXFUCIW2rd3GkvM3MszNzRtU9ZA8E5ygD8CMOGa13ZCXDeErxGL1HZBLmYGDRC07564Vm4lXe8nezuejBiXRFqZA75nPvqyK33yklSJJyFMSmpgZAwZCweaiJZALivm3nKqQh273wkPpym2hOwAZCw03V3c2MeMuwEz4e73SoXJ92drTRW2ZAAjwTideQcNc4qqZAhTsSMmxBiIh' },
  { pageId: '1044468135423441', name: 'Minh Anh', token: 'EABAX69avEfIBRSunEJSliu6MRde3MZAFRSjTT4COfkwwQICZB9uTXnI1ZAZBor9CaDviE6dWc6UkhP7h0XJy0YHcBCY2chQDLpKbPxwmIL2kTcaQDDSMXi6P9KH0lMXoR7wDHTrJpQPQ1cA25ZBsl4FmzuOdH2e0h7d2SinxxlCzDyJbCfuMtlpOkitEZCqtDjRJ8wUWK5PkLXavbQf6aXO7Sn' },
  { pageId: '1142742645581562', name: 'Nguyễn An Thư', token: 'EABAX69avEfIBRTukuDZAALm2CasjQ1sYS73lMXivOZCu7QIa9sv4tzVk7lV8IlEZCo1o2aWUlFZCPLT9bmHYKtVAZBEkAAIFYZAJ9SVq1BJfhjL5lHtjbGDtUtEIxibNZASZC6fZAYfyRbKSnuoWYYmLwh6ZCPTsuBmrwBhmestcOWzPyZAhJJjAMLVc1aNEpFrSXmZB4HLEoak0XZAjtZCZBE0r54jFErG' },
];

const TARGET_IG_ID = '17841477990850937'; // _sullybbi

async function main() {
  console.log(`🔍 Tìm FB page linked với IG: ${TARGET_IG_ID} (_sullybbi)\n`);

  for (const page of FB_PAGES) {
    const url = `https://graph.facebook.com/v21.0/${page.pageId}?fields=instagram_business_account&access_token=${page.token}`;
    const res = await fetch(url);
    const json = await res.json() as any;
    
    const igId = json.instagram_business_account?.id ?? 'none';
    const match = igId === TARGET_IG_ID ? '✅ MATCH!' : '';
    console.log(`${page.name} (${page.pageId}): IG linked = ${igId} ${match}`);
    
    if (json.error) {
      console.log(`  ❌ Error: ${json.error.message}`);
    }
  }

  // Also check: maybe _sullybbi can send using just its own credentials
  // Try /me on the IG account to see what permissions it has
  console.log('\n📋 Checking which pages have instagram_business_account field accessible...');
  
  // Try to get _sullybbi profile using each page token
  for (const page of FB_PAGES) {
    const url = `https://graph.facebook.com/v21.0/${TARGET_IG_ID}?fields=id,name,username&access_token=${page.token}`;
    const res = await fetch(url);
    const json = await res.json() as any;
    if (json.id) {
      console.log(`✅ ${page.name} token can access _sullybbi: ${json.name ?? json.username}`);
    } else if (json.error) {
      console.log(`❌ ${page.name} cannot access _sullybbi: ${json.error.message}`);
    }
  }
}

main();
