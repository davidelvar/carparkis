import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { authConfig as baseConfig } from './config.edge';
import { CustomPrismaAdapter } from './adapter';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

// Development email transport - logs to console instead of sending
const devEmailServer = process.env.NODE_ENV === 'development' 
  ? {
      host: 'localhost',
      port: 25,
      auth: { user: '', pass: '' },
    }
  : {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    };

export const authConfig: NextAuthConfig = {
  ...baseConfig,
  adapter: CustomPrismaAdapter(),
  providers: [
    EmailProvider({
      server: devEmailServer,
      from: process.env.EMAIL_FROM || 'noreply@carpark.is',
      // Custom sendVerificationRequest for development
      ...(process.env.NODE_ENV === 'development' && {
        sendVerificationRequest: async ({ identifier: email, url }) => {
          console.log('\n');
          console.log('━'.repeat(60));
          console.log('📧 MAGIC LINK LOGIN (Development Mode)');
          console.log('━'.repeat(60));
          console.log(`To: ${email}`);
          console.log(`\nClick this link to sign in:\n`);
          console.log(`\x1b[36m${url}\x1b[0m`);
          console.log('\n' + '━'.repeat(60) + '\n');
        },
      }),
    }),
    // Staff PIN login provider
    CredentialsProvider({
      id: 'staff-pin',
      name: 'Staff PIN',
      credentials: {
        email: { label: 'Email', type: 'email' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.pin) {
          throw new Error('Email and PIN are required');
        }

        const email = credentials.email as string;
        const pin = credentials.pin as string;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            pin: true,
          },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Only allow staff (OPERATOR or ADMIN) to use PIN login
        if (user.role === 'CUSTOMER') {
          throw new Error('PIN login is only available for staff');
        }

        // Check if user has a PIN set
        if (!user.pin) {
          throw new Error('PIN not set. Contact administrator.');
        }

        // Verify PIN
        const isValid = await bcrypt.compare(pin, user.pin);
        if (!isValid) {
          throw new Error('Invalid PIN');
        }

        // Return user for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...baseConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Add role to JWT token for middleware access
      if (user) {
        // User object is only available on sign in
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      
      // If no role in token, fetch from database (handles existing sessions)
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // JWT sessions - token contains the data
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle callback URLs properly
      // If it's a relative URL, prepend baseUrl
      if (url.startsWith('/')) {
        // Make sure we don't redirect back to login after successful auth
        if (url.includes('/login')) {
          return `${baseUrl}/is`;
        }
        return `${baseUrl}${url}`;
      }
      
      // If it's an absolute URL on the same origin, use it
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          // Make sure we don't redirect back to login after successful auth
          if (urlObj.pathname.includes('/login')) {
            return `${baseUrl}/is`;
          }
          return url;
        }
      } catch {
        // Invalid URL, fall through to default
      }
      
      // Default to home with locale
      return `${baseUrl}/is`;
    },
    async signIn({ user }) {
      // Allow sign in for all users
      return true;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      // Log sign-in events if needed
      console.log(`User signed in: ${user.email} (new: ${isNewUser})`);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
