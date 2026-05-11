import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { groqClient } from '@/infrastructure/ai/groq-client';
import { AI_MODELS } from '@/domain/types/ai';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignName, campaignObjective, persona } = await req.json();

    if (!campaignName) {
      return NextResponse.json({ error: 'Missing campaignName' }, { status: 400 });
    }

    // Xây dựng ngữ cảnh thương hiệu và xưng hô dựa trên thiết lập Persona của tài khoản
    let personaContext = "";
    if (persona) {
      const { name, gender, personality, tone, signature_emojis, custom_instructions } = persona;
      const emojiList = Array.isArray(signature_emojis) ? signature_emojis.join(', ') : (signature_emojis || '');
      
      personaContext = `
### KHUNG PHONG CÁCH CỦA TÀI KHOẢN (Setup Profile):
- Tên nhân vật ảo (Persona Name): "${name || 'Em'}"
- Giới tính (Gender): ${gender === 'female' ? 'Nữ (Xưng hô: Em/Mình, gọi khách là Anh/Chị)' : gender === 'male' ? 'Nam (Xưng hô: Em/Mình, gọi khách là Anh/Chị)' : 'Phi giới tính'}
- Tính cách (Personality): "${personality || 'Ngọt ngào, tinh tế, hỗ trợ tận tâm'}"
- Tông giọng chủ đạo (Tone/Voice Style): "${tone || 'Ấm áp, chuyên nghiệp nhưng gần gũi'}"
${emojiList ? `- Biểu tượng cảm xúc đặc trưng (Emojis): ${emojiList}` : ''}
${custom_instructions ? `- Chỉ dẫn bổ sung: ${custom_instructions}` : ''}

### CHỈ DẪN QUAN TRỌNG VỀ ĐẠI TỪ NHÂN XƯNG VÀ PHONG CÁCH:
- Hãy nhập vai hoàn hảo vào nhân vật "${name || 'Em'}" để viết Lời chào hàng (Current Offer) và Thông điệp khan hiếm (Scarcity).
- Cách xưng hô và thái độ viết phải đồng bộ 100% với mục "Giới tính", "Tính cách", và "Tông giọng" ở trên.
- Sử dụng từ ngữ tự nhiên, ngọt ngào, tinh tế của một Creator thực thụ trên mạng xã hội (Instagram, Facebook), tuyệt đối KHÔNG viết kiểu văn bản công nghiệp, cứng nhắc, hay dịch thuật thô sơ.
- Phân bổ ${emojiList ? `các icon cảm xúc trong danh sách [${emojiList}]` : 'các icon cảm xúc dễ thương, tinh tế'} một cách nhẹ nhàng và tự nhiên ở cuối câu.`;
    }

    const systemPrompt = `You are a high-converting copywriting expert specializing in social media marketing, personal branding, and DM automation.
Given the Campaign Name and Campaign Objective, propose:
1. "currentOffer" (Lời chào hàng hiện tại): A compelling, high-converting, sweet and persuasive offer tailored to the objective in Vietnamese.
2. "scarcityMessage" (Thông điệp khan hiếm): A natural, polite psychological trigger in Vietnamese to create urgency and FOMO without sounding cheap.
${personaContext}

You must reply with a valid JSON object ONLY. Do NOT wrap it in \`\`\`json or any formatting. Return raw JSON text.
JSON structure:
{
  "currentOffer": "string",
  "scarcityMessage": "string"
}`;

    const objectiveLabelMap: Record<string, string> = {
      lead_generation: 'Thu thập Lead (SĐT/Email/Thông tin liên hệ để gửi quà/tư vấn)',
      direct_sale: 'Chốt Sale Trực tiếp (Gửi Link ưu đãi/Sản phẩm/VIP đặc quyền)',
      support: 'Chăm sóc Khách hàng (Support/Giải đáp thắc mắc/Tư vấn sâu)',
      engagement: 'Tăng tương tác (Engagement/Trò chuyện thân mật/Kết nối)',
    };

    const objectiveLabel = objectiveLabelMap[campaignObjective] || campaignObjective;

    const userPrompt = `Campaign Name: "${campaignName}"
Campaign Objective: "${objectiveLabel}"`;

    const { data: completion, error: groqError } = await groqClient.complete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: AI_MODELS.GENERATE,
      temperature: 0.85,
      jsonMode: true
    });

    if (groqError || !completion) {
      console.error('[Campaign Proposal] Groq completion failed:', groqError);
      return NextResponse.json({ error: `Groq error: ${groqError || 'Empty completion'}` }, { status: 500 });
    }

    try {
      const parsedData = JSON.parse(completion.content);
      return NextResponse.json({
        currentOffer: parsedData.currentOffer || '',
        scarcityMessage: parsedData.scarcityMessage || '',
      });
    } catch (parseError) {
      console.warn('[Campaign Proposal] JSON parse error:', completion.content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[API Campaign Proposal] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
