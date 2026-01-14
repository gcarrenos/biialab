import { createAuthClient } from '@neondatabase/neon-js/auth';

// Create the Neon Auth client
// The auth URL comes from your Neon Console -> Auth tab
export const authClient = createAuthClient(
  process.env.NEXT_PUBLIC_NEON_AUTH_URL!
);

// Export auth methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
