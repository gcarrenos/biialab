'use server';

import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function subscribeToWaitlist(email: string, source: string = 'coming-soon') {
  try {
    // Check if email already exists
    const existing = await db.query.waitlist.findFirst({
      where: eq(waitlist.email, email.toLowerCase()),
    });

    if (existing) {
      return { success: true, message: 'already_subscribed' };
    }

    // Add to waitlist
    await db.insert(waitlist).values({
      email: email.toLowerCase(),
      source,
    });

    return { success: true, message: 'subscribed' };
  } catch (error) {
    console.error('Error subscribing to waitlist:', error);
    return { success: false, message: 'error', error: String(error) };
  }
}

export async function getWaitlistCount() {
  try {
    const result = await db.query.waitlist.findMany();
    return { success: true, count: result.length };
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    return { success: false, count: 0 };
  }
}

export async function getWaitlistEmails() {
  try {
    const result = await db.query.waitlist.findMany({
      orderBy: (waitlist, { desc }) => [desc(waitlist.subscribedAt)],
    });
    return { success: true, emails: result };
  } catch (error) {
    console.error('Error getting waitlist emails:', error);
    return { success: false, emails: [] };
  }
}
