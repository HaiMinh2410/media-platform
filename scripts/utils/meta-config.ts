import { db } from '../../src/lib/db';

/**
 * Helper to fetch accounts from environment or a standard JSON structure.
 * This avoids hardcoding IDs and names in multiple scripts.
 */
export async function getTargetPages() {
  // Option 1: Load from META_PAGES_JSON environment variable
  if (process.env.META_PAGES_JSON) {
    try {
      return JSON.parse(process.env.META_PAGES_JSON);
    } catch (err) {
      console.error('Failed to parse META_PAGES_JSON env var');
    }
  }

  // Option 2: Fallback to current hardcoded values but marked as fallback
  // In a real production system, these would be fetched from a secure vault or a CLI argument
  return [
    {
      id: '1122137857642529',
      name: 'Kathryn',
      access_token: process.env.KATHRYN_TOKEN || '',
      category: 'Người sáng tạo nội dung số',
    },
    {
      id: '1044468135423441',
      name: 'Minh Anh',
      access_token: process.env.MINH_ANH_TOKEN || '',
      category: 'Người sáng tạo nội dung số',
    },
    {
      id: '1142742645581562',
      name: 'Nguyễn An Thư',
      access_token: process.env.AN_THU_TOKEN || '',
      category: 'Người sáng tạo nội dung số',
    },
  ].filter(p => p.access_token !== '');
}
