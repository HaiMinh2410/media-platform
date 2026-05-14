import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkStorage() {
  console.log('Checking storage buckets...')
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  
  if (bucketError) {
    console.error('Error listing buckets:', bucketError)
    return
  }

  console.log('Available buckets:', buckets.map(b => b.name))
  
  const mediaBucket = buckets.find(b => b.name === 'media')
  if (!mediaBucket) {
    console.log('Bucket "media" NOT FOUND! Creating it...')
    const { data, error } = await supabase.storage.createBucket('media', {
      public: true,
      allowedMimeTypes: ['image/*', 'video/*'],
      fileSizeLimit: 52428800 // 50MB
    })
    if (error) {
      console.error('Error creating bucket:', error)
    } else {
      console.log('Bucket "media" created successfully.')
    }
  } else {
    console.log('Bucket "media" exists.')
    if (!mediaBucket.public) {
      console.log('Warning: Bucket "media" is not public.')
    }
  }
}

checkStorage()
