'use server';

import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import comingSoon from '@/lib/data/coming-soon.json';

const VALID_SLUGS = new Set((comingSoon as { slug: string }[]).map((c) => c.slug));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Records "avísame cuando salga" interest for a coming-soon class. Reuses the
// waitlist table: one row per email, interested class slugs accumulate in
// metadata.interests. Counting happens via /api/admin/waitlist (admin-gated).
export async function registerInterest(email: string, classSlug: string) {
  try {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || !VALID_SLUGS.has(classSlug)) {
      return { success: false as const, message: 'invalid' };
    }

    const existing = await db.query.waitlist.findFirst({
      where: eq(waitlist.email, clean),
    });

    if (existing) {
      const interests: string[] = Array.isArray(existing.metadata?.interests)
        ? existing.metadata.interests
        : [];
      if (interests.includes(classSlug)) {
        return { success: true as const, message: 'already' };
      }
      await db.update(waitlist)
        .set({ metadata: { ...(existing.metadata ?? {}), interests: [...interests, classSlug] } })
        .where(eq(waitlist.email, clean));
      return { success: true as const, message: 'registered' };
    }

    await db.insert(waitlist).values({
      email: clean,
      source: 'interest',
      metadata: { interests: [classSlug] },
    });
    return { success: true as const, message: 'registered' };
  } catch (error) {
    console.error('registerInterest error:', error);
    return { success: false as const, message: 'error' };
  }
}
