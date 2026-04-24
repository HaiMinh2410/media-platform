// scratch/test-api.ts
async function main() {
  const workspaceId = '092d6e35-5be8-423c-a9c4-c2c3111f1f1d'; // I need a valid workspace ID
  // I'll just fetch from DB and check the repository function directly
}
import { getConversations } from '../src/infrastructure/repositories/conversation.repository';

async function testRepo() {
  const workspaceId = '51fa4239-e10b-4ecb-a8fd-cd9e48bc0de6';
  const { data, error } = await getConversations({ workspaceId }, { limit: 10 });
  if (error) console.error(error);
  // Find the specific conversation we synced
  const convo = data?.find(c => c.platform_conversation_id === '1001499849209648');
  console.log(JSON.stringify(convo, null, 2));
}

testRepo();
