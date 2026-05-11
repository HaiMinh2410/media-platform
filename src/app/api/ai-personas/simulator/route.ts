import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { buildDynamicSystemPrompt } from '@/application/ai-agent/prompts/response-generator.prompt';
import { groqClient } from '@/infrastructure/ai/groq-client';
import { AI_MODELS } from '@/domain/types/ai';

// POST /api/ai-personas/simulator
// Simulates persona execution with draft configuration and groq client
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, persona, incomingMessage, history = [] } = await req.json();

    if (!incomingMessage || !persona) {
      return NextResponse.json({ error: 'Missing incomingMessage or persona' }, { status: 400 });
    }

    // 1. Build dynamic system prompt
    const systemPrompt = buildDynamicSystemPrompt(persona);

    // 2. Map history and create full messages array
    // Map 'you'/'assistant' -> 'assistant' and 'fan'/'user' -> 'user'
    const mappedHistory = history.map((m: any) => {
      let role: 'user' | 'assistant' = 'user';
      if (m.role === 'assistant' || m.role === 'you') {
        role = 'assistant';
      }
      return {
        role,
        content: m.content
      };
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...mappedHistory,
      { role: 'user', content: incomingMessage }
    ];

    // 3. Complete using Groq client with JSON Mode
    const { data: completion, error: groqError } = await groqClient.complete(messages as any, {
      model: AI_MODELS.GENERATE, // Default to llama-3.3-70b-versatile
      temperature: 0.7,
      jsonMode: true
    });

    if (groqError || !completion) {
      console.error('[Simulator] Groq completion failed:', groqError);
      return NextResponse.json({ error: `Groq error: ${groqError || 'Empty completion'}` }, { status: 500 });
    }

    // 4. Parse output JSON safely
    try {
      const parsedData = JSON.parse(completion.content);
      return NextResponse.json({
        reply: parsedData.reply || 'Dạ vâng ạ.',
        action: parsedData.action || 'continue',
        reasoning: parsedData.notes_for_next || 'Hội thoại tiếp tục bình thường.',
        confidence: parsedData.update_emotion_score || 0.8
      });
    } catch (parseError) {
      console.warn('[Simulator] JSON parse error on completion content:', completion.content);
      // Fallback response if LLM outputs invalid JSON even with JSON Mode
      return NextResponse.json({
        reply: completion.content,
        action: 'continue',
        reasoning: 'Không thể phân tích dữ liệu JSON từ LLM.',
        confidence: 0.5
      });
    }
  } catch (error: any) {
    console.error('[API Persona Simulator] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
