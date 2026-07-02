import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { MIGRATION_SQL, MIGRATION_SQL_0001 } from '@/lib/db/migration-sql';

export const maxDuration = 60;

// Applies embedded schema migrations statement-by-statement. Idempotent:
// - 0000 (base schema): statements failing with "already exists" are skipped.
// - 0001 (auth reshape): DROPS and recreates the auth tables, so it only runs
//   when the users table still has the legacy shape (no "image" column).
//   Once reshaped — and especially once real users exist — it never runs again.
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

    const runStatements = async (bundle: string) => {
      const statements = bundle.split('--> statement-breakpoint')
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
      return results;
    };

    const results = await runStatements(MIGRATION_SQL);

    // 0001 guard: legacy users table has no "image" column; the reshaped one does.
    const imageCol = await sql.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'image'`
    );
    const rows = Array.isArray(imageCol) ? imageCol : (imageCol as { rows: unknown[] }).rows;
    let authReshapeRan = false;
    if (!rows || rows.length === 0) {
      results.push(...await runStatements(MIGRATION_SQL_0001));
      authReshapeRan = true;
    }

    const failed = results.filter((r) => r.status === 'failed');
    return NextResponse.json({
      success: failed.length === 0,
      applied: results.filter((r) => r.status === 'applied').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      authReshapeRan,
      failed,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
