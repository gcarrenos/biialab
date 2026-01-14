'use client';

import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from '@/lib/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient}>
      {children}
    </NeonAuthUIProvider>
  );
}
