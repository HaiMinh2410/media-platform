import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

async function testUpload() {
  console.log('Testing anonymous upload to "media" bucket...')
  
  // Create a dummy file
  const blob = new Blob(['test content'], { type: 'text/plain' })
  const file = new File([blob], 'test.txt', { type: 'text/plain' })
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(`test-${Date.now()}.txt`, file)
  
  if (error) {
    console.error('Upload FAILED:', error)
    if (error.message.includes('new row violates row-level security policy')) {
      console.log('REASON: RLS Policy is missing or blocking the upload.')
    }
  } else {
    console.log('Upload SUCCESSFUL:', data)
  }
}

testUpload()
