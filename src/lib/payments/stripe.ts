// Minimal Stripe Checkout client (server-only). Uses the REST API directly —
// creating and retrieving Checkout Sessions doesn't justify the SDK dependency.
//
// Feature flag: payments are enabled only when BOTH env vars are set:
//   STRIPE_SECRET_KEY       — sk_live_... / sk_test_...
//   CERTIFICATE_PRICE_USD   — e.g. "19" or "19.99"
// While either is missing, every certificate behaves as unlocked (free mode,
// identical to the platform's original behavior).

const STRIPE_API = 'https://api.stripe.com/v1';

export function certificatePriceUsd(): number | null {
  const raw = process.env.CERTIFICATE_PRICE_USD;
  if (!raw) return null;
  const price = Number(raw);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function paymentsEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY) && certificatePriceUsd() !== null;
}

async function stripeRequest(path: string, params?: Record<string, string>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');

  const res = await fetch(`${STRIPE_API}${path}`, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe ${path}: ${data?.error?.message ?? res.statusText}`);
  }
  return data;
}

export interface CheckoutSession {
  id: string;
  url: string | null;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  metadata: Record<string, string>;
}

// Hosted Checkout page for unlocking one certificate.
export async function createCertificateCheckout(opts: {
  certificateNumber: string;
  courseTitle: string;
  customerEmail: string;
  origin: string;
}): Promise<CheckoutSession> {
  const price = certificatePriceUsd();
  if (price === null) throw new Error('CERTIFICATE_PRICE_USD not configured');

  return stripeRequest('/checkout/sessions', {
    mode: 'payment',
    customer_email: opts.customerEmail,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(Math.round(price * 100)),
    'line_items[0][price_data][product_data][name]': `Certificado verificado — ${opts.courseTitle}`,
    'line_items[0][price_data][product_data][description]':
      `Credencial ${opts.certificateNumber} · biialab.org`,
    'metadata[certificate_number]': opts.certificateNumber,
    success_url: `${opts.origin}/api/checkout/certificate/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/verify/${opts.certificateNumber}`,
  });
}

export async function retrieveCheckoutSession(sessionId: string): Promise<CheckoutSession> {
  return stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}
