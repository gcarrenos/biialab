import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { emailSends } from '@/lib/db/schema';
import { sendStartCourse, sendResumeCourse } from '@/lib/email';

// Re-engagement job. Safe to run on a schedule: every guard below exists so that
// running it twice, or every day forever, cannot spam anyone.
//
//   - only users who have NOT opted out
//   - only enrollments whose last activity is inside MAX_IDLE_DAYS (someone gone
//     for two months is not coming back for a reminder, and mailing them is how
//     you earn spam complaints)
//   - at least MIN_IDLE_DAYS since they were last seen, so nobody gets nudged
//     while they are literally mid-course
//   - one email per user per kind per course, enforced by a unique index
//   - one marketing email per user per COOLDOWN_DAYS, however many courses they
//     have stalled in
//   - a hard cap per run

export const MIN_IDLE_DAYS = 3;
export const MAX_IDLE_DAYS = 30;
export const COOLDOWN_DAYS = 7;
export const DEFAULT_LIMIT = 25;

export type ReengageKind = 'start_course' | 'resume_course';

export interface Candidate {
  userId: string;
  email: string;
  name: string | null;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  totalLessons: number;
  done: number;
  idleDays: number;
  kind: ReengageKind;
}

// Enrollments that stalled, already filtered by opt-out, cooldown and history.
export async function findCandidates(limit = DEFAULT_LIMIT): Promise<Candidate[]> {
  const rows = await db.execute(sql`
    with act as (
      select e.user_id, e.course_id, c.title, c.slug, c.total_lessons,
             count(lp.id) filter (where lp.completed) as done,
             coalesce(max(lp.updated_at), e.enrolled_at) as last_seen
      from enrollments e
      join courses c on c.id = e.course_id
      left join modules m on m.course_id = c.id
      left join lessons l on l.module_id = m.id
      left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = e.user_id
      where c.status = 'published' and c.total_lessons > 0
      group by e.user_id, e.course_id, c.title, c.slug, c.total_lessons, e.enrolled_at
    )
    select a.user_id, u.email, u.name, a.course_id, a.title, a.slug,
           a.total_lessons, a.done,
           extract(day from now() - a.last_seen)::int as idle_days,
           case when a.done = 0 then 'start_course' else 'resume_course' end as kind
    from act a
    join users u on u.id = a.user_id
    where a.done < a.total_lessons
      and u.email_optout = false
      and a.last_seen <= now() - make_interval(days => ${MIN_IDLE_DAYS})
      and a.last_seen >  now() - make_interval(days => ${MAX_IDLE_DAYS})
      -- never the same email twice for the same course
      and not exists (
        select 1 from email_sends es
        where es.user_id = a.user_id and es.course_id = a.course_id
          and es.kind = case when a.done = 0 then 'start_course' else 'resume_course' end)
      -- and not if this person got any reminder recently
      and not exists (
        select 1 from email_sends es2
        where es2.user_id = a.user_id
          and es2.sent_at > now() - make_interval(days => ${COOLDOWN_DAYS}))
    order by a.last_seen desc
    limit ${limit}
  `);

  const data = (rows as unknown as { rows?: Record<string, unknown>[] }).rows ?? (rows as unknown as Record<string, unknown>[]);
  return data.map((r) => ({
    userId: String(r.user_id),
    email: String(r.email),
    name: (r.name as string) ?? null,
    courseId: String(r.course_id),
    courseTitle: String(r.title),
    courseSlug: String(r.slug),
    totalLessons: Number(r.total_lessons),
    done: Number(r.done),
    idleDays: Number(r.idle_days),
    kind: r.kind as ReengageKind,
  }));
}

export interface ReengageResult {
  considered: number;
  sent: number;
  failed: number;
  dryRun: boolean;
  detail: { email: string; course: string; kind: ReengageKind; idleDays: number; ok: boolean }[];
}

export async function runReengage(opts: { limit?: number; dryRun?: boolean } = {}): Promise<ReengageResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const dryRun = opts.dryRun ?? false;
  const candidates = await findCandidates(limit);
  const detail: ReengageResult['detail'] = [];
  let sent = 0;
  let failed = 0;

  for (const c of candidates) {
    if (dryRun) {
      detail.push({ email: c.email, course: c.courseTitle, kind: c.kind, idleDays: c.idleDays, ok: true });
      continue;
    }

    // Record first, then send. If the insert loses a race with another run the
    // unique index rejects it and we skip — better a missed email than a double.
    try {
      await db.insert(emailSends).values({ userId: c.userId, kind: c.kind, courseId: c.courseId });
    } catch {
      continue;
    }

    const ok = c.kind === 'start_course'
      ? await sendStartCourse({
          to: c.email, userId: c.userId, name: c.name,
          courseTitle: c.courseTitle, courseSlug: c.courseSlug, totalLessons: c.totalLessons,
        })
      : await sendResumeCourse({
          to: c.email, userId: c.userId, name: c.name,
          courseTitle: c.courseTitle, courseSlug: c.courseSlug,
          done: c.done, remaining: c.totalLessons - c.done,
        });

    if (ok) sent++; else failed++;
    detail.push({ email: c.email, course: c.courseTitle, kind: c.kind, idleDays: c.idleDays, ok });
  }

  return { considered: candidates.length, sent, failed, dryRun, detail };
}
