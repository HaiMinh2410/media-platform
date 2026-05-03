import { NextRequest, NextResponse } from 'next/server';
import { generateService } from '@/application/ai/generate.service';

/**
 * POST /api/ai/rewrite
 * Rewrites a draft message with a specific tone using Groq.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, tone } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const { data, error } = await generateService.rewrite(text, tone || 'professional');

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[API AI Rewrite] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
