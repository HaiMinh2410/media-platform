import { runWeeklyMetricsAggregation, collectWeeklyMetricsForWorkspace } from '../src/application/ai-agent/metrics-collector';
import { db } from '../src/lib/db';

async function testMetrics() {
  console.log('🧪 Starting weekly metrics test...');

  try {
    // 1. Get first workspace
    const workspace = await db.workspace.findFirst({
      select: { id: true, name: true }
    });

    if (!workspace) {
      console.warn('⚠️ No workspace found in database. Cannot run individual test.');
      return;
    }

    console.log(`🔍 Testing collection for Workspace: ${workspace.name} (${workspace.id})`);
    const metrics = await collectWeeklyMetricsForWorkspace(workspace.id, new Date());
    
    console.log('📊 Result Snapshot:');
    console.log(JSON.stringify(metrics, null, 2));

    console.log('\n🌟 Testing full weekly aggregation & database saving...');
    await runWeeklyMetricsAggregation(new Date());
    
    console.log('✅ Weekly aggregation ran and persisted to database successfully!');
  } catch (error) {
    console.error('❌ Weekly metrics test failed with error:', error);
  } finally {
    await db.$disconnect();
  }
}

testMetrics();
