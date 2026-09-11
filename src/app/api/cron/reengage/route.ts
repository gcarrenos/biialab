import { NextResponse } from 'next/server';
import { runReengage, DEFAULT_LIMIT } from '@/lib/db/actions/reengage';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Scheduled by vercel.json. Vercel signs the call with CRON_SECRET; nobody else
// can trigger it.
//
// Ships wired but inert: without REENGAGE_ENABLED=1 it reports what it WOULD
// send and mails nothing. That way the schedule can be verified in production
// before a single reminder goes out, and it can be switched off again by
// removing one env var rather than a deploy.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const enabled = process.env.REENGAGE_ENABLED === '1';
  const result = await runReengage({ limit: DEFAULT_LIMIT, dryRun: !enabled });

  console.log(`cron reengage: enabled=${enabled} considered=${result.considered} sent=${result.sent} failed=${result.failed}`);
  return NextResponse.json({
    enabled,
    ...result,
    detail: result.detail.map((d) => ({ ...d, email: d.email.replace(/^(.).*(@.*)$/, '$1***$2') })),
  });
}
