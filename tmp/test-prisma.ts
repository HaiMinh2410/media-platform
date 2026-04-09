import "dotenv/config";
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':****@'));
  console.log('PRISMA_CLIENT_ENGINE_TYPE:', process.env.PRISMA_CLIENT_ENGINE_TYPE);
  
  try {
    const prisma = new PrismaClient();
    console.log('Prisma Client instantiated');
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Query result:', result);
    await prisma.$disconnect();
  } catch (error: any) {
    console.error('ERROR TYPE:', error.constructor.name);
    console.error('ERROR MESSAGE:', error.message);
    if (error.stack) {
       console.error('STACK:', error.stack);
    }
  }
}

main();
