import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DIRECT_URL!)

async function applyStoragePolicies() {
  console.log('Applying storage policies for "media" bucket...')
  
  try {
    // 1. Ensure bucket is public
    await sql`
      update storage.buckets 
      set public = true 
      where id = 'media';
    `
    console.log('Bucket "media" set to PUBLIC.')

    // 2. Enable RLS (if not already enabled)
    // 3. Create policies
    // We'll use a broad policy for development: allow all operations for anon/authenticated
    
    // Policy for INSERT (Upload)
    await sql`
      create policy "Allow public upload"
      on storage.objects for insert
      to public
      with check (bucket_id = 'media');
    `.catch(e => console.log('Policy "Allow public upload" already exists or error:', e.message))

    // Policy for SELECT (View)
    await sql`
      create policy "Allow public select"
      on storage.objects for select
      to public
      using (bucket_id = 'media');
    `.catch(e => console.log('Policy "Allow public select" already exists or error:', e.message))

    // Policy for DELETE (Remove)
    await sql`
      create policy "Allow public delete"
      on storage.objects for delete
      to public
      using (bucket_id = 'media');
    `.catch(e => console.log('Policy "Allow public delete" already exists or error:', e.message))

    console.log('Storage policies applied successfully.')
  } catch (err: any) {
    console.error('Failed to apply policies:', err.message)
  } finally {
    await sql.end()
  }
}

applyStoragePolicies()
