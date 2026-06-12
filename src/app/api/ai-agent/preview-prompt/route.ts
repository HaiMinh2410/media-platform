import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/api/supabase/server';
import { buildDynamicSystemPrompt } from '@features/ai-agent/services/prompts/response-generator.prompt';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { persona, customerGender = null } = await req.json();

    if (!persona) {
      return NextResponse.json({ error: 'Missing persona' }, { status: 400 });
    }

    const systemPrompt = buildDynamicSystemPrompt(persona, customerGender);

    return NextResponse.json({
      systemPrompt,
    });
  } catch (error) {
    console.error('[API Preview Prompt] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
