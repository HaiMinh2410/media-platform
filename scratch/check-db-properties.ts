import { db } from '../src/lib/db';

console.log('--- Prisma DB Keys ---');
const keys = Object.keys(db);
console.log(keys.filter(k => k.toLowerCase().includes('metric') || k.toLowerCase().includes('agent')));
process.exit(0);
