import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { users, sessions, accounts, verifications } from '@/lib/db/schema';

// Server-side auth instance (better-auth + Drizzle/Neon).
// Client-side helpers live in src/lib/auth-client.ts.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.biialab.org',
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false, // never settable from the client
      },
    },
  },
  advanced: {
    database: {
      // Schema uses uuid columns; better-auth defaults to random strings.
      generateId: () => crypto.randomUUID(),
    },
  },
});
