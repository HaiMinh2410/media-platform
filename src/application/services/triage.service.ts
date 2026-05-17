import { db } from '@/lib/db';
import { ClassifyResult } from '@/domain/types/ai-pipeline';

/**
 * Triage Service
 * Responsible for applying AI analysis results to conversations and routing to agents.
 */
export class TriageService {
  /**
   * Performs triage on a conversation based on AI analysis.
   * Updates priority, sentiment, tags and assigns an agent if needed.
   */
  async triage(conversationId: string, analysis: ClassifyResult): Promise<{ error: string | null }> {
    try {
      console.log(`[TriageService] Triaging conversation ${conversationId}...`);

      // 1. Map priority text to numeric scale (1-3)
      const priorityMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
      const priorityValue = priorityMap[analysis.priority] || 1;

      // 2. Fetch conversation with workspace context
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { platform_accounts: true }
      });

      if (!conversation) {
        return { error: 'CONVERSATION_NOT_FOUND' };
      }

      const workspaceId = conversation.platform_accounts.workspaceId;

      // 3. Prepare update data
      // We merge existing tags if any, but ensure category is present
      const existingTags = Array.isArray(conversation.tags) ? conversation.tags : [];
      const newTags = Array.from(new Set([...existingTags, analysis.category]));

      const updateData: any = {
        priority: priorityValue,
        sentiment: analysis.sentiment,
        tags: newTags,
      };

      // 4. Set SLA expiration (e.g., 2 hours for high, 8 hours for low)
      // This is a basic rule-based SLA for MVP
      /*
      if (!conversation.sla_expires_at) {
        const slaHours = analysis.priority === 'high' ? 2 : (analysis.priority === 'medium' ? 4 : 12);
        updateData.sla_expires_at = new Date(Date.now() + slaHours * 60 * 60 * 1000);
      }
      */

      // 5. Auto-assignment logic
      // Only assign if no one is currently assigned
      /*
      if (!conversation.assignee_id) {
        const bestAgentId = await this.findBestAgent(workspaceId);
        if (bestAgentId) {
          updateData.assignee_id = bestAgentId;
          console.log(`[TriageService] Auto-assigned conversation ${conversationId} to agent ${bestAgentId}`);
        }
      }
      */

      // 6. Persist changes
      await db.conversation.update({
        where: { id: conversationId },
        data: updateData
      });

      return { error: null };
    } catch (err: any) {
      console.error('❌ [TriageService] Error performing triage:', err);
      return { error: err.message || 'TRIAGE_FAILED' };
    }
  }
}

export const triageService = new TriageService();
