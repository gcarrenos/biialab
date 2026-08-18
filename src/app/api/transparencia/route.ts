import { NextResponse } from 'next/server';
import { getTransparencyMetricsSafe } from '@/lib/db/actions/transparency';

export const revalidate = 3600;

/** Public, aggregate-only platform metrics (same data as /transparencia). */
export async function GET() {
  const metrics = await getTransparencyMetricsSafe();
  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
