import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import type { Adapter, AdapterSession } from 'next-auth/adapters';

/**
 * Custom Prisma Adapter that wraps the default PrismaAdapter
 * and handles edge cases like deleting non-existent sessions
 */
export function CustomPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma);

  return {
    ...baseAdapter,
    
    // Override deleteSession to handle non-existent sessions gracefully
    async deleteSession(sessionToken: string): Promise<AdapterSession | null | undefined> {
      try {
        const session = await prisma.session.delete({
          where: { sessionToken },
        });
        return session as AdapterSession;
      } catch (error: unknown) {
        // Ignore "record not found" errors - session may already be deleted
        if (
          error instanceof Error &&
          error.message.includes('Record to delete does not exist')
        ) {
          return null;
        }
        // Check for Prisma's P2025 error code (record not found)
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === 'P2025'
        ) {
          return null;
        }
        throw error;
      }
    },
  };
}
