import { NextResponse } from 'next/server';
import { retrieveCheckoutSession } from '@/lib/payments/stripe';

export const maxDuration = 30;

// Stripe success_url for the Diplomado presale: verify server-side, then land
// on the thanks state. Orders are tracked in Stripe (metadata.type).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) return NextResponse.redirect(new URL('/diplomado', url.origin));

  try {
    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status === 'paid' && session.metadata?.type === 'diplomado_presale') {
      return NextResponse.redirect(new URL('/diplomado?gracias=1', url.origin));
    }
  } catch (error) {
    console.error('diplomado confirm error:', error);
  }
  return NextResponse.redirect(new URL('/diplomado', url.origin));
}
