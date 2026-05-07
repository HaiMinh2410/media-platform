import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse multi-part form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspaceId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 2. Read file content to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Generate unique file name
    const fileExt = file.name.split('.').pop() || '';
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${randomId}.${fileExt}`;
    const filePath = `inbox/${workspaceId || 'common'}/${fileName}`;

    // 4. Initialize server-side Supabase client
    const supabase = await createClient();

    // 5. Upload to 'media' bucket
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[API Upload] Supabase storage upload failed:', error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    // 6. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      publicUrl,
      title: file.name,
      fileSize: file.size,
      type: file.type
    });
  } catch (err: any) {
    console.error('[API Upload] Unexpected error during upload:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
