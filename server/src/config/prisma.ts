import { PrismaClient } from '@prisma/client';
import { env } from './index';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const basePrisma =
  global.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Query Timing Logger: Warns when any DB operation exceeds 100ms
export const prisma = (basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = performance.now();
        const result = await query(args);
        const duration = performance.now() - start;
        if (duration > 100 && env.NODE_ENV === 'development') {
          console.warn(`⚠️ [SLOW QUERY] ${model}.${operation} took ${duration.toFixed(2)}ms`);
        }
        return result;
      },
    },
  },
}) as unknown) as PrismaClient;

if (env.NODE_ENV !== 'production') {
  global.__prisma = basePrisma;
}
