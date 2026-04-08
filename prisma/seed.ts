import { PrismaClient, Platform, ConvStatus, SenderType } from '@prisma/client'

const prisma = new PrismaClient()

const TARGET_USER_ID = '33513f3f-860c-4694-9d02-daad2a8d8035'

async function main() {
  console.log('🌱 Start seeding test data...')

  // 1. Project Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: '960cc767-f655-4672-9c3a-86a02df91409' },
    update: { userId: TARGET_USER_ID },
    create: {
      id: '960cc767-f655-4672-9c3a-86a02df91409',
      name: 'Hai Minh Workspace',
      userId: TARGET_USER_ID,
    },
  })
  console.log('✅ Workspace created:', workspace.name)

  // 2. Platform Accounts
  const accountsData = [
    {
      id: 'f9b3b0d1-0f1c-4b5a-9366-5e5d3c8c7a6e',
      platform: Platform.FACEBOOK,
      externalId: 'fb_page_101',
      name: 'Hai Minh Official (FB)',
      accessToken: 'fb_access_token_mock',
    },
    {
      id: 'd2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7',
      platform: Platform.TIKTOK,
      externalId: 'tt_account_202',
      name: 'Minh Media (TikTok)',
      accessToken: 'tt_access_token_mock',
      refreshToken: 'tt_refresh_token_mock',
    }
  ]

  for (const acc of accountsData) {
    await prisma.platformAccount.upsert({
      where: { platform_externalId: { platform: acc.platform, externalId: acc.externalId } },
      update: { workspaceId: workspace.id },
      create: {
        ...acc,
        workspaceId: workspace.id,
      }
    })
  }
  console.log('✅ Platform Accounts created')

  // 3. Conversations & Messages
  const fbAccount = await prisma.platformAccount.findFirst({ where: { platform: Platform.FACEBOOK } })
  if (fbAccount) {
    const conv = await prisma.conversation.upsert({
      where: { platform_externalId: { platform: Platform.FACEBOOK, externalId: 'conv_fb_001' } },
      update: {},
      create: {
        id: 'c1b2a3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        platformAccountId: fbAccount.id,
        platform: Platform.FACEBOOK,
        externalId: 'conv_fb_001',
        status: ConvStatus.OPEN,
      }
    })

    const messages = [
      {
        content: 'Chào Admin, cho mình hỏi giá dịch vụ với!',
        senderId: 'external_user_001',
        senderType: SenderType.USER,
      },
      {
        content: 'Chào bạn, cảm ơn bạn đã quan tâm. Bạn vui lòng đợi trong giây lát, AI của chúng tôi sẽ phản hồi ngay.',
        senderId: 'system_bot',
        senderType: SenderType.BOT,
      },
      {
        content: 'Dạ vâng ạ.',
        senderId: 'external_user_001',
        senderType: SenderType.USER,
      }
    ]

    for (const msg of messages) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          ...msg
        }
      })
    }
    console.log('✅ FB Conversation & Messages created')
  }

  console.log('🚀 Seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
