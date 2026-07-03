// Thin wrapper over gtag. No-ops when GA isn't loaded (missing
// NEXT_PUBLIC_GA_ID, ad-blocker, or server render), so call sites never guard.
// 'sign_up' and 'login' are GA4 recommended events — keep those names as-is.

export type AnalyticsEvent =
  | 'sign_up'
  | 'login'
  | 'course_enroll'
  | 'lesson_start'
  | 'video_progress' // params: { percent: 25 | 50 | 75 | 95 }
  | 'lesson_complete' // params: { method: 'auto' | 'manual' }
  | 'exam_start'
  | 'exam_submit' // params: { passed, score }
  | 'certificate_linkedin_share';

type Gtag = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

export function track(event: AnalyticsEvent, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  const gtag = (window as { gtag?: Gtag }).gtag;
  if (typeof gtag === 'function') gtag('event', event, params);
}
