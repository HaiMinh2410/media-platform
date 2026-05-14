const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL
});

async function applyStoragePolicies() {
  console.log('Applying storage policies for "media" bucket using pg...');
  
  try {
    await client.connect();
    
    // 1. Ensure bucket is public
    await client.query(`
      UPDATE storage.buckets 
      SET public = true 
      WHERE id = 'media';
    `);
    console.log('Bucket "media" set to PUBLIC.');

    // 2. Policy for INSERT (Upload)
    try {
      await client.query(`
        CREATE POLICY "Allow public upload"
        ON storage.objects FOR INSERT
        TO public
        WITH CHECK (bucket_id = 'media');
      `);
      console.log('Policy "Allow public upload" created.');
    } catch (e) {
      console.log('Policy "Allow public upload" already exists or error:', e.message);
    }

    // 3. Policy for SELECT (View)
    try {
      await client.query(`
        CREATE POLICY "Allow public select"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'media');
      `);
      console.log('Policy "Allow public select" created.');
    } catch (e) {
      console.log('Policy "Allow public select" already exists or error:', e.message);
    }

    // 4. Policy for DELETE (Remove)
    try {
      await client.query(`
        CREATE POLICY "Allow public delete"
        ON storage.objects FOR DELETE
        TO public
        USING (bucket_id = 'media');
      `);
      console.log('Policy "Allow public delete" created.');
    } catch (e) {
      console.log('Policy "Allow public delete" already exists or error:', e.message);
    }

    console.log('Storage policies applied successfully.');
  } catch (err) {
    console.error('Failed to apply policies:', err.message);
  } finally {
    await client.end();
  }
}

applyStoragePolicies();
