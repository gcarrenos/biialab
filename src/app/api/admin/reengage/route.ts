import { NextResponse } from 'next/server';
import { runReengage, DEFAULT_LIMIT } from '@/lib/db/actions/reengage';

export const maxDuration = 60;

// Manual trigger for the same job the cron runs, so the first batch can be sent
// by hand and watched. Body: { password, limit?, dryRun? }.
// dryRun defaults to TRUE: sending real email must be asked for explicitly.
export async function POST(request: Request) {
  try {
    const { password, limit, dryRun } = await request.json();
    if (password !== (process.env.ADMIN_PASSWORD || 'biialab2026')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const result = await runReengage({
      limit: typeof limit === 'number' ? Math.min(limit, 100) : DEFAULT_LIMIT,
      dryRun: dryRun !== false,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('admin reengage error:', error);
    return NextResponse.json({ success: false, message: 'server' }, { status: 500 });
  }
}
