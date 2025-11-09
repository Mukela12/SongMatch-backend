import { beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

/**
 * Test Setup and Teardown
 *
 * This file runs before all tests and handles setup/cleanup.
 */

beforeAll(async () => {
  // Initialize test database connection
  await prisma.$connect();

  // Initialize test Redis connection
  await redis.ping();

  console.log('✅ Test environment initialized');
});

afterEach(async () => {
  // Clean up test data after each test
  // This ensures tests are isolated and don't interfere with each other

  // Clear all tables (in reverse order of foreign key dependencies)
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.log(`Could not truncate ${tablename}:`, error);
      }
    }
  }

  // Clear Redis test data
  const keys = await redis.keys('test:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
});

afterAll(async () => {
  // Disconnect from database and Redis
  await prisma.$disconnect();
  await redis.quit();

  console.log('✅ Test environment cleaned up');
});
