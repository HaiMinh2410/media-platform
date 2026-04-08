import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`
    console.log('✅ Connection successful:', res)
  } catch (e) {
    console.error('❌ Connection failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
