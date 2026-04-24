import { metaProfileService } from '../src/application/services/meta-profile.service';

async function testSync() {
  const conversationId = '79c566a2-6494-44cd-b076-7da11059f668';
  const platform = 'instagram';
  const externalSenderId = '823109480346891';
  const encryptedToken = '2a8243711a1eaed6506660ca:c8e13b5568edffff0dfaf366cf36dcc0:bf65a37a074646fb439d0a53e5f076d03b02a9ad81760434606b776d850777ddae3601c614f8eb1bfbb1d2836422e28f265a7d1ed465be35ff70bbd7c6d9ca8f8564001b2cf71a87ecb7a53fe9ffadae7a2fd2623a2f2a8879865ec89d4e8f98de2a960c638566c2f5b23be4f9bd3a9a92e34601997a9304f69bc5fb213844f03b5a1682d601a846a3cdb1de71b0d88bb7a727d88c47170420aa8835b6109e39e21dacae0b8c1aea3f93338b5fdf3935e72d7a3a616391e63560222c7a74da394dce781b8277d8320ffd9d53e73cd4cd79108fcda63c05842bc2fd4b3967fef083743a728fb4f0fdf6b00f338cb6a987a6263b3a1dd435a30ed3574c6b19947f757e9d9d07c0';

  console.log(`🔍 Syncing profile for ${externalSenderId}...`);
  await metaProfileService.syncCustomerProfile({
    conversationId,
    platform,
    externalSenderId,
    encryptedToken
  });
  console.log('✅ Done');
}

testSync().catch(console.error);
