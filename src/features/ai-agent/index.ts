// src/features/ai-agent/index.ts

// Export Types
export * from './types';
export * from './types-agent';
export * from './types-pipeline';

// Export Repositories
export * from './repositories/customer-identity.repository';
export * from './repositories/fan-profile.repository';

// Export Services
export { groqClient } from './services/groq-client';
export { classifyService } from './services/classify.service';
export { generateService } from './services/generate.service';
export { selectModel } from './services/model-selector';
export { evaluateABTest, promoteWinnerIfAny, logABTestDecision } from './services/ab-test-manager';
export { retrieveContext, calculateInteractiveDays } from './services/context-retriever';
export { summarizeConversation } from './services/context-summarizer';
export { canSendLink, decideAction } from './services/decision-engine';
export { scoreEmotionAndTrend } from './services/emotion-scorer';
export { classifyFanRuleBased, shouldReclassifyFan } from './services/fan-classifier';
export { collectWeeklyMetricsForWorkspace, runWeeklyMetricsAggregation } from './services/metrics-collector';
export { detectObjection } from './services/objection-handler';
export { aiAgentReplyQueue, aiAgentReplyWorker, AI_AGENT_REPLY_QUEUE_NAME } from './services/reply-delay-scheduler';
export { generateResponse } from './services/response-generator';
export { filterBlacklist, checkSafety, calculateDelay, checkLinkRateLimit } from './services/safety-checker';
export { determineStage, determineFlirtLevel, assessRisk } from './services/state-manager';
export { aiRoutingService, AIRoutingService } from './services/ai-routing.service';

// Export Main AI Agent Pipeline
export { processIncomingMessage } from './services/pipeline';

