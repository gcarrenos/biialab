import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { MIGRATION_SQL } from '@/lib/db/migration-sql';

export const maxDuration = 60;

// Applies the embedded schema migration statement-by-statement. Idempotent:
// statements failing with "already exists"/duplicate errors are skipped, so
// it is safe to run against a database that already has some tables (waitlist).
export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'biialab2026';
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, message: 'DATABASE_URL not configured' }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const statements = MIGRATION_SQL.split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    const results: { statement: string; status: 'applied' | 'skipped' | 'failed'; error?: string }[] = [];

    for (const statement of statements) {
      const label = statement.slice(0, 80).replace(/\s+/g, ' ');
      try {
        await sql.query(statement);
        results.push({ statement: label, status: 'applied' });
      } catch (error) {
        const msg = String(error);
        if (/already exists|duplicate/i.test(msg)) {
          results.push({ statement: label, status: 'skipped' });
        } else {
          results.push({ statement: label, status: 'failed', error: msg });
        }
      }
    }

    const failed = results.filter((r) => r.status === 'failed');
    return NextResponse.json({
      success: failed.length === 0,
      applied: results.filter((r) => r.status === 'applied').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
