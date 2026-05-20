import * as fs from 'fs';
import * as path from 'path';

// Cấu hình mapping
const mappings = [
  // Analytics Feature
  { pattern: /@\/components\/analytics\//g, replacement: '@features/analytics/components/' },
  { pattern: /@\/hooks\/use-analytics/g, replacement: '@features/analytics/hooks/use-analytics' },
  { pattern: /@\/application\/services\/meta-analytics\.service/g, replacement: '@features/analytics/services/meta-analytics.service' },
  { pattern: /@\/infrastructure\/repositories\/analytics\.repository/g, replacement: '@features/analytics/repositories/analytics.repository' },
  { pattern: /@\/application\/actions\/analytics\.actions/g, replacement: '@features/analytics/actions/analytics.actions' },
  { pattern: /@\/domain\/types\/analytics/g, replacement: '@features/analytics/types' },
  { pattern: /@\/lib\/post-analytics-engine/g, replacement: '@features/analytics/services/post-analytics-engine' },
  { pattern: /@\/lib\/analytics-utils/g, replacement: '@shared/lib/analytics-utils' },
  
  // Dashboard Feature
  { pattern: /@\/components\/dashboard\//g, replacement: '@features/dashboard/components/' },
  { pattern: /@\/application\/actions\/dashboard\.actions/g, replacement: '@features/dashboard/actions/dashboard.actions' },
  
  // Posts Feature
  { pattern: /@\/components\/posts\//g, replacement: '@features/posts/components/' },
  { pattern: /@\/components\/post-composer\//g, replacement: '@features/posts/components/post-composer/' },
  { pattern: /@\/components\/publisher\//g, replacement: '@features/posts/components/publisher/' },
  { pattern: /@\/hooks\/use-draft/g, replacement: '@features/posts/hooks/use-draft' },
  { pattern: /@\/hooks\/use-publish-status/g, replacement: '@features/posts/hooks/use-publish-status' },
  { pattern: /@\/hooks\/use-validation/g, replacement: '@features/posts/hooks/use-validation' },
  { pattern: /@\/application\/services\/batch-publish\.service/g, replacement: '@features/posts/services/batch-publish.service' },
  { pattern: /@\/application\/services\/duplicate-detection\.service/g, replacement: '@features/posts/services/duplicate-detection.service' },
  { pattern: /@\/infrastructure\/services\/meta-publishing\.service/g, replacement: '@features/posts/services/meta-publishing.service' },
  { pattern: /@\/infrastructure\/repositories\/post\.repository/g, replacement: '@features/posts/repositories/post.repository' },
  { pattern: /@\/infrastructure\/repositories\/publish-job\.repository/g, replacement: '@features/posts/repositories/publish-job.repository' },
  { pattern: /@\/infrastructure\/repositories\/publisher-account\.repository/g, replacement: '@features/posts/repositories/publisher-account.repository' },
  { pattern: /@\/infrastructure\/repositories\/publisher-token\.repository/g, replacement: '@features/posts/repositories/publisher-token.repository' },
  { pattern: /@\/domain\/types\/posts/g, replacement: '@features/posts/types' },

  // Settings Feature
  { pattern: /@\/components\/settings\//g, replacement: '@features/settings/components/' },
  { pattern: /@\/application\/services\/meta-connection\.service/g, replacement: '@features/settings/services/meta-connection.service' },
  { pattern: /@\/application\/services\/meta-profile\.service/g, replacement: '@features/settings/services/meta-profile.service' },
  { pattern: /@\/application\/services\/token-management\.service/g, replacement: '@features/settings/services/token-management.service' },
  { pattern: /@\/application\/services\/account-sync\.service/g, replacement: '@features/settings/services/account-sync.service' },
  { pattern: /@\/infrastructure\/crypto\/token-encryption\.service/g, replacement: '@features/settings/services/token-encryption.service' },
  { pattern: /@\/infrastructure\/repositories\/platform-account\.repository/g, replacement: '@features/settings/repositories/platform-account.repository' },
  { pattern: /@\/infrastructure\/repositories\/workspace\.repository/g, replacement: '@features/settings/repositories/workspace.repository' },
  { pattern: /@\/infrastructure\/repositories\/account-group\.repository/g, replacement: '@features/settings/repositories/account-group.repository' },
  { pattern: /@\/application\/actions\/platform-account\.actions/g, replacement: '@features/settings/actions/platform-account.actions' },
  { pattern: /@\/application\/actions\/workspace\.actions/g, replacement: '@features/settings/actions/workspace.actions' },
  { pattern: /@\/application\/actions\/account-group\.actions/g, replacement: '@features/settings/actions/account-group.actions' },
  { pattern: /@\/domain\/types\/platform-account/g, replacement: '@features/settings/types' },
  { pattern: /@\/domain\/types\/workspace/g, replacement: '@features/settings/types' },
  { pattern: /@\/domain\/types\/account-group/g, replacement: '@features/settings/types' },

  // Inbox Feature
  { pattern: /@\/application\/actions\/inbox\.actions/g, replacement: '@features/inbox/actions/inbox.actions' },
  { pattern: /@\/application\/actions\/unread-counts\.actions/g, replacement: '@features/inbox/actions/unread-counts.actions' },
  { pattern: /@\/application\/services\/webhook-ingestion\.service/g, replacement: '@features/inbox/services/webhook-ingestion.service' },
  { pattern: /@\/application\/services\/webhook-handler\.service/g, replacement: '@features/inbox/services/webhook-handler.service' },
  { pattern: /@\/application\/services\/triage\.service/g, replacement: '@features/inbox/services/triage.service' },
  { pattern: /@\/application\/services\/meta-send\.service/g, replacement: '@features/inbox/services/meta-send.service' },
  { pattern: /@\/infrastructure\/meta\/meta-messaging\.client/g, replacement: '@features/inbox/services/meta-messaging.client' },
  { pattern: /@\/infrastructure\/meta\/meta-security\.service/g, replacement: '@features/inbox/services/meta-security.service' },
  { pattern: /@\/infrastructure\/repositories\/conversation\.repository/g, replacement: '@features/inbox/repositories/conversation.repository' },
  { pattern: /@\/domain\/types\/messaging/g, replacement: '@features/inbox/types' },
  { pattern: /@\/domain\/types\/meta-webhook/g, replacement: '@features/inbox/types' },
  { pattern: /@\/domain\/types\/webhooks/g, replacement: '@features/inbox/types' },
  
  // AI Agent Feature
  { pattern: /@\/application\/ai\//g, replacement: '@features/ai-agent/services/' },
  { pattern: /@\/application\/ai-agent\//g, replacement: '@features/ai-agent/services/' },
  { pattern: /@\/infrastructure\/ai\/groq-client/g, replacement: '@features/ai-agent/services/groq-client' },
  { pattern: /@\/infrastructure\/repositories\/customer-identity\.repository/g, replacement: '@features/ai-agent/repositories/customer-identity.repository' },
  { pattern: /@\/infrastructure\/repositories\/fan-profile\.repository/g, replacement: '@features/ai-agent/repositories/fan-profile.repository' },
  { pattern: /@\/domain\/types\/ai/g, replacement: '@features/ai-agent/types' },
  { pattern: /@\/domain\/types\/ai-agent/g, replacement: '@features/ai-agent/types' },
  { pattern: /@\/domain\/types\/ai-pipeline/g, replacement: '@features/ai-agent/types' },
  { pattern: /@\/domain\/types\/customer-identity/g, replacement: '@features/ai-agent/types' },

  // Shared UI & Layout & Providers
  { pattern: /@\/components\/ui\//g, replacement: '@shared/ui/' },
  { pattern: /@\/components\/auth\//g, replacement: '@features/auth/components/' },
  { pattern: /@\/components\/layout\//g, replacement: '@shared/components/layout/' },
  { pattern: /@\/components\/providers\/query-provider/g, replacement: '@shared/providers/query-provider' },

  // Shared API
  { pattern: /@\/infrastructure\/supabase\//g, replacement: '@shared/api/supabase/' },
  { pattern: /@\/infrastructure\/meta\/graph-api\.client/g, replacement: '@shared/api/meta/graph-api.client' },
  { pattern: /@\/infrastructure\/meta\/meta-parser\.service/g, replacement: '@features/inbox/services/meta-parser.service' },
  { pattern: /@\/infrastructure\/meta\/adapters\//g, replacement: '@shared/api/meta/adapters/' },
  { pattern: /(\.\.\/)+message\.repository/g, replacement: '@features/inbox/repositories/message.repository' },

  // Shared Lib
  { pattern: /@\/infrastructure\/queue\//g, replacement: '@shared/lib/queue/' },
  { pattern: /@\/lib\/utils/g, replacement: '@shared/lib/utils' },
  { pattern: /@\/lib\/meta-fetch/g, replacement: '@shared/lib/meta-fetch' },
  { pattern: /@\/lib\/validation\//g, replacement: '@shared/lib/validation/' },
  { pattern: /@\/utils\/meta-error-mapper/g, replacement: '@shared/lib/meta-error-mapper' },
  { pattern: /@\/lib\/db/g, replacement: '@shared/lib/db' },
  { pattern: /@\/lib\/query-client/g, replacement: '@shared/lib/query-client' },
  { pattern: /@\/application\/services\/feature-flag\.service/g, replacement: '@shared/lib/feature-flag.service' },
  { pattern: /@\/application\/queue\/queue\.service/g, replacement: '@shared/lib/queue/queue.service' },
  { pattern: /@\/application\/monitoring\/health\.service/g, replacement: '@shared/lib/monitoring/health.service' },
  { pattern: /@\/application\/ai-agent/g, replacement: '@features/ai-agent' },

  // Shared Types
  { pattern: /@\/domain\/types\/database/g, replacement: '@shared/types/database' },
  { pattern: /@\/domain\/types\/meta/g, replacement: '@shared/types/meta' },
  { pattern: /@\/domain\/types\/queue/g, replacement: '@shared/types/queue' },
  { pattern: /@\/domain\/types\/security/g, replacement: '@shared/types/security' },
  { pattern: /@\/domain\/types\/crypto/g, replacement: '@shared/types/crypto' }
];

function walkDir(dir: string, callback: (filePath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(filePath, callback);
      }
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      callback(filePath);
    }
  }
}

const targetDir = path.resolve(__dirname, '../src');
console.log(`Bắt đầu quét thư mục: ${targetDir}`);

let totalFiles = 0;
let modifiedFiles = 0;

walkDir(targetDir, (filePath) => {
  totalFiles++;
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  for (const map of mappings) {
    if (map.pattern.test(content)) {
      content = content.replace(map.pattern, map.replacement);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Đã cập nhật import trong: ${path.relative(targetDir, filePath)}`);
    modifiedFiles++;
  }
});

console.log(`\nHoàn thành! Đã quét ${totalFiles} files. Cập nhật thành công ${modifiedFiles} files.`);
