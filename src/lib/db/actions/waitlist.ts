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

export async function submitContactMessage(email: string, message: string) {
  try {
    const trimmed = message.trim().slice(0, 2000);
    if (!trimmed) {
      return { success: false, message: 'empty' };
    }

    await db
      .insert(waitlist)
      .values({
        email: email.toLowerCase(),
        source: 'contact',
        metadata: { message: trimmed },
      })
      .onConflictDoUpdate({
        target: waitlist.email,
        set: { metadata: { message: trimmed }, source: 'contact' },
      });

    return { success: true, message: 'sent' };
  } catch (error) {
    console.error('Error submitting contact message:', error);
    return { success: false, message: 'error' };
  }
}

// NOTE: waitlist reads happen only through /api/admin/waitlist, which verifies
// the admin password server-side. Do not add unauthenticated read actions here —
// server actions are publicly callable endpoints.
