import type { NextAuthConfig } from 'next-auth';

// Base auth config without providers - safe for Edge runtime
// This is used by middleware for session checking
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async authorized({ auth, request }) {
      // This callback is used by middleware
      return true; // Let middleware handle the actual logic
    },
  },
  session: {
    strategy: 'jwt', // Use JWT so middleware can read the token
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [], // Providers added in full config
};
