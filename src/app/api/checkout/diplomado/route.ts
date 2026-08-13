import { NextResponse } from 'next/server';
import { createDiplomadoCheckout, diplomadoEnabled } from '@/lib/payments/stripe';

export const maxDuration = 30;

// Starts a Stripe Checkout for the Diplomado presale. No auth: Stripe
// collects the buyer's email; orders live in the Stripe dashboard
// (metadata.type = diplomado_presale) until access is granted on launch.
export async function POST(request: Request) {
  try {
    if (!diplomadoEnabled()) {
      return NextResponse.json({ error: 'not_available' }, { status: 503 });
    }
    const origin = new URL(request.url).origin;
    const checkout = await createDiplomadoCheckout(origin);
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error('diplomado checkout error:', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
