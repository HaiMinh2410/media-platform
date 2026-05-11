import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infrastructure/supabase/server';
import { db } from '@/lib/db';

const aiPersonaSettingsSchema = z.object({
  campaign_objective: z.enum(['lead_generation', 'direct_sale', 'support', 'engagement']).default('lead_generation'),
  delay_min: z.number().int().nonnegative().default(15),
  delay_max: z.number().int().nonnegative().default(120),
  link_rate_limit: z.number().int().nonnegative().default(3),
  blacklist_keywords: z.array(z.string()).default([]),
});

const aiPersonaUpdateSchema = z.object({
  name: z.string().min(1).default('Em'),
  gender: z.string().default('female'),
  age: z.number().int().positive().nullable().optional(),
  personality: z.string().nullable().optional(),
  tone: z.string().nullable().optional(),
  speaking_style: z.string().nullable().optional(),
  signature_emojis: z.array(z.string()).default([]),
  custom_instructions: z.string().nullable().optional(),
  system_prompt_override: z.string().nullable().optional(),
  campaign_name: z.string().nullable().optional(),
  current_offer: z.string().nullable().optional(),
  scarcity_message: z.string().nullable().optional(),
  settings: aiPersonaSettingsSchema.default({
    campaign_objective: 'lead_generation',
    delay_min: 15,
    delay_max: 120,
    link_rate_limit: 3,
    blacklist_keywords: []
  }),
  tone_instructions: z.string().default('Be professional, polite, and concise.'),
  emoji_usage: z.string().default('minimal'),
  language_preference: z.string().default('vi'),
});

// GET /api/ai-personas/[accountId]
// Get or create dynamic default persona for the account
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ accountId: string }> }
) {
  try {
    const params = await props.params;
    const { accountId } = params;

    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify account ownership
    const account = await db.platformAccount.findFirst({
      where: {
        id: accountId,
        workspace: {
          workspace_members: {
            some: {
              profile_id: user.id,
            },
          },
        },
      },
      include: {
        ai_personas: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found or forbidden' }, { status: 404 });
    }

    // If already exists, return it
    if (account.ai_personas) {
      return NextResponse.json({ data: account.ai_personas });
    }

    // Return mock/default data but don't save to DB yet (lazy initialization)
    const defaultPersona = {
      account_id: accountId,
      name: 'Em',
      gender: 'female',
      age: 22,
      personality: '',
      tone: 'Professional, polite, and concise.',
      speaking_style: '',
      signature_emojis: [],
      custom_instructions: '',
      system_prompt_override: '',
      campaign_name: '',
      current_offer: '',
      scarcity_message: '',
      settings: {
        campaign_objective: 'lead_generation',
        delay_min: 15,
        delay_max: 120,
        link_rate_limit: 3,
        blacklist_keywords: [],
      },
      tone_instructions: 'Be professional, polite, and concise.',
      emoji_usage: 'minimal',
      language_preference: 'vi',
    };

    return NextResponse.json({ data: defaultPersona });
  } catch (error: any) {
    console.error('[API Persona GET] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/ai-personas/[accountId]
// Upsert persona configuration
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ accountId: string }> }
) {
  try {
    const params = await props.params;
    const { accountId } = params;

    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify account ownership
    const account = await db.platformAccount.findFirst({
      where: {
        id: accountId,
        workspace: {
          workspace_members: {
            some: {
              profile_id: user.id,
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found or forbidden' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = aiPersonaUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid data format', details: validationResult.error.format() }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Upsert database record
    const persona = await db.aIPersona.upsert({
      where: { account_id: accountId },
      create: {
        account_id: accountId,
        name: validatedData.name,
        gender: validatedData.gender,
        age: validatedData.age,
        personality: validatedData.personality,
        tone: validatedData.tone,
        speaking_style: validatedData.speaking_style,
        signature_emojis: validatedData.signature_emojis,
        custom_instructions: validatedData.custom_instructions,
        system_prompt_override: validatedData.system_prompt_override,
        campaign_name: validatedData.campaign_name,
        current_offer: validatedData.current_offer,
        scarcity_message: validatedData.scarcity_message,
        settings: validatedData.settings as any,
        tone_instructions: validatedData.tone_instructions,
        emoji_usage: validatedData.emoji_usage,
        language_preference: validatedData.language_preference,
      },
      update: {
        name: validatedData.name,
        gender: validatedData.gender,
        age: validatedData.age,
        personality: validatedData.personality,
        tone: validatedData.tone,
        speaking_style: validatedData.speaking_style,
        signature_emojis: validatedData.signature_emojis,
        custom_instructions: validatedData.custom_instructions,
        system_prompt_override: validatedData.system_prompt_override,
        campaign_name: validatedData.campaign_name,
        current_offer: validatedData.current_offer,
        scarcity_message: validatedData.scarcity_message,
        settings: validatedData.settings as any,
        tone_instructions: validatedData.tone_instructions,
        emoji_usage: validatedData.emoji_usage,
        language_preference: validatedData.language_preference,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ data: persona });
  } catch (error: any) {
    console.error('[API Persona PUT] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
