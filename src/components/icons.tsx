/**
 * Minimal stroke-based line icons, sized for inline use (16-20px,
 * currentColor). Used in place of emoji across category tabs, section
 * headers, and course card meta rows.
 */
type IconProps = {
  size?: number;
  className?: string;
};

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconSparkle({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
    </svg>
  );
}

export function IconBrain({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M9.5 4a2.5 2.5 0 00-2.5 2.5v.2A2.7 2.7 0 005 9.3v1.4a2.7 2.7 0 00-1 2.1c0 1 .5 1.9 1.3 2.4a2.6 2.6 0 002.4 3.6h.3A2.5 2.5 0 0010.5 21h1" />
      <path d="M14.5 4A2.5 2.5 0 0117 6.5v.2a2.7 2.7 0 012 2.6v1.4a2.7 2.7 0 011 2.1c0 1-.5 1.9-1.3 2.4a2.6 2.6 0 01-2.4 3.6h-.3A2.5 2.5 0 0113.5 21h-1V5" />
    </svg>
  );
}

export function IconBriefcase({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 012-2h4a2 2 0 012 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  );
}

export function IconCpu({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" rx="0.5" />
      <path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
    </svg>
  );
}

export function IconChartBar({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeWidth="1.75" />
    </svg>
  );
}

export function IconBolt({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

export function IconCode({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M9 8l-5 4 5 4M15 8l5 4-5 4" />
    </svg>
  );
}

export function IconBook({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 16.5v-11z" />
      <path d="M4 16.5A2.5 2.5 0 016.5 14H20" />
    </svg>
  );
}

export function IconLayers({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13.5l9 5 9-5" />
      <path d="M3 8.5l9 5 9-5" />
    </svg>
  );
}

export function IconChevronRight({ size = 16, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconCheck({ size = 12, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function IconSearch({ size = 18, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

/** Maps a course category name to its line icon. Falls back to IconBook. */
const CATEGORY_ICON: Record<string, (props: IconProps) => React.ReactElement> = {
  'Desarrollo Personal': IconBrain,
  'Negocios': IconBriefcase,
  'Inteligencia Artificial': IconCpu,
  'Machine Learning': IconChartBar,
  'Productividad': IconBolt,
  'Data Science': IconChartBar,
  'Programación': IconCode,
};

export function categoryIcon(category: string): (props: IconProps) => React.ReactElement {
  return CATEGORY_ICON[category] ?? IconBook;
}
