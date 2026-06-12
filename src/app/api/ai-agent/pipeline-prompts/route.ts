import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/api/supabase/server';
import { longContextSummaryPrompt } from '@features/ai-agent/services/prompts/long-context-summary.prompt';
import { PROMPTS } from '@features/ai-agent/services/prompt-templates';
import { EMOTION_SCORER_SYSTEM_PROMPT } from '@features/ai-agent/services/emotion-scorer';
import { classifierPrompt } from '@features/ai-agent/services/prompts/classifier.prompt';
import { objectionPrompt } from '@features/ai-agent/services/prompts/objection.prompt';
import { responseGeneratorPrompt, buildDynamicSystemPrompt } from '@features/ai-agent/services/prompts/response-generator.prompt';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Assemble dynamic prompts in preview format for settings detail page
    const summarizerSystem = typeof longContextSummaryPrompt.system === 'function'
      ? longContextSummaryPrompt.system({ agent_pronoun: 'Em', fan_pronoun: 'Fan' })
      : longContextSummaryPrompt.system;

    const summarizerUser = longContextSummaryPrompt.user({
      history: [
        { role: 'fan', content: 'Recent messages from Fan...', timestamp: new Date() }
      ],
      currentProfile: {
        id: '123',
        conversationId: 'conv-123',
        workspaceId: 'work-123',
        platformUserId: 'user-123',
        fanType: 'Unknown',
        stage: 'G1',
        flirtLevel: 0,
        emotionScore: 0.5,
        emotionTrend: 'stable',
        dayCount: 1,
        messageCount: 2,
        riskLevel: 'low',
        purchaseHistory: [],
        objectionsSeen: [],
        keyInsights: [],
        nextAction: 'continue',
        notes: null,
        linkSentCount: 0,
        lastLinkSentAt: null,
        lastSummary: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      now: new Date().toISOString(),
      agent_pronoun: 'Em'
    });

    const classifySystem = PROMPTS.CLASSIFY_MESSAGE.system;
    const classifyUser = typeof PROMPTS.CLASSIFY_MESSAGE.user === 'function'
      ? PROMPTS.CLASSIFY_MESSAGE.user({ text: '{{incoming_message}}' })
      : PROMPTS.CLASSIFY_MESSAGE.user;

    const sentimentScorerSystem = EMOTION_SCORER_SYSTEM_PROMPT;

    const hybridClassifierSystem = classifierPrompt.system;
    const hybridClassifierUser = typeof classifierPrompt.user === 'function'
      ? classifierPrompt.user({
          recent_messages: [
            { role: 'fan', content: '{{recent_messages}}' }
          ]
        })
      : classifierPrompt.user;

    const objectionSystem = typeof objectionPrompt.system === 'function'
      ? objectionPrompt.system({ agent_pronoun: 'em', fan_pronoun: 'anh', agent_gender: 'female' })
      : objectionPrompt.system;

    const objectionUser = typeof objectionPrompt.user === 'function'
      ? objectionPrompt.user({
          objection_type: '{{objection_type}}',
          incoming_message: '{{incoming_message}}',
          fan_type: 'Luy',
          stage: 'G2',
          emotion_score: 0.75,
          agent_pronoun: 'em',
          fan_pronoun: 'anh'
        })
      : objectionPrompt.user;

    const responseGeneratorSystem = buildDynamicSystemPrompt(null, null, null, null);
    const responseGeneratorUser = typeof responseGeneratorPrompt.user === 'function'
      ? responseGeneratorPrompt.user({
          fan_type: '{{fan_type}}',
          stage: '{{stage}}',
          emotion_score: 0.75,
          flirt_level_target: 1,
          strategy: '{{strategy}}',
          recent_messages: [
            { role: 'fan', content: '{{recent_messages}}' }
          ],
          incoming_message: '{{incoming_message}}',
          should_send_link: false,
          link_to_send: '{{link_to_send}}'
        })
      : responseGeneratorPrompt.user;

    return NextResponse.json({
      summarizer: { system: summarizerSystem, user: summarizerUser },
      classify: { system: classifySystem, user: classifyUser },
      sentimentScorer: { system: sentimentScorerSystem },
      hybridClassifier: { system: hybridClassifierSystem, user: hybridClassifierUser },
      objectionHandler: { system: objectionSystem, user: objectionUser },
      responseGenerator: { system: responseGeneratorSystem, user: responseGeneratorUser }
    });
  } catch (error) {
    console.error('[API Pipeline Prompts] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
