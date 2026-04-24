import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { db as prisma } from '@/lib/db';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accountId = params.id;

    // Verify account access (through workspace)
    const account = await prisma.platformAccount.findFirst({
      where: {
        id: accountId,
        workspace: {
          workspace_members: {
            some: {
              profile_id: user.id
            }
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    // Upsert bot config
    let config = await prisma.bot_configurations.findUnique({
      where: { account_id: accountId }
    });

    if (!config) {
      config = await prisma.bot_configurations.create({
        data: {
          account_id: accountId,
          is_active: false,
          trigger_labels: [],
          confidence_threshold: 0.75,
          auto_send: false,
          system_prompt: '',
          model: 'auto'
        } as any
      });
    }

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('[BotConfig GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accountId = params.id;
    const body = await request.json();

    const account = await prisma.platformAccount.findFirst({
      where: {
        id: accountId,
        workspace: {
          workspace_members: {
            some: {
              profile_id: user.id
            }
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    const updatedConfig = await prisma.bot_configurations.upsert({
      where: { account_id: accountId },
      create: {
        account_id: accountId,
        is_active: body.is_active ?? false,
        trigger_labels: body.trigger_labels ?? [],
        confidence_threshold: body.confidence_threshold ?? 0.75,
        auto_send: body.auto_send ?? false,
        system_prompt: body.system_prompt ?? '',
        model: body.model ?? 'auto',
      } as any,
      update: {
        is_active: body.is_active,
        trigger_labels: body.trigger_labels,
        confidence_threshold: body.confidence_threshold,
        auto_send: body.auto_send,
        system_prompt: body.system_prompt,
        model: body.model,
        updated_at: new Date()
      } as any
    });

    return NextResponse.json({ data: updatedConfig });
  } catch (error) {
    console.error('[BotConfig PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
