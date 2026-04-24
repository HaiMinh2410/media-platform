import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Needs service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRealtime() {
  console.log('🕵️ Listening for ALL changes on messages table (Service Role)...');
  
  const channel = supabase
    .channel('test-all-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        console.log('🚀 [SERVICE ROLE] Received message:', payload.new);
      }
    )
    .subscribe((status) => {
      console.log('Status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed! Waiting for messages... (Ctrl+C to stop)');
      }
    });
}

testRealtime().catch(console.error);
