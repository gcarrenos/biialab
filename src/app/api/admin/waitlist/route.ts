import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'biialab2026';
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const emails = await db.query.waitlist.findMany({
      orderBy: (waitlist, { desc }) => [desc(waitlist.subscribedAt)],
    });

    return NextResponse.json({ success: true, emails });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
