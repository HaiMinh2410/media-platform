try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  console.log('Successfully instantiated PrismaClient');
} catch (e) {
  console.error('Failed to instantiate PrismaClient:', e);
}
