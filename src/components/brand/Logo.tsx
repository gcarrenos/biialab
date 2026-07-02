/**
 * Original BiiALab brand mark: three ascending rounded bars on a gradient
 * square, symbolizing growth. Intentionally distinct from Whop's chevron
 * mark — do not imitate it.
 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      role="img"
      aria-label="BiiALab"
    >
      <defs>
        <linearGradient id="biiag" x1="0" y1="64" x2="64" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff4d14" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#biiag)" />
      <rect x="12" y="38" width="10" height="14" rx="4" fill="white" fillOpacity="0.85" />
      <rect x="27" y="28" width="10" height="24" rx="4" fill="white" fillOpacity="0.92" />
      <rect x="42" y="14" width="10" height="38" rx="4" fill="white" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
  /** When true, renders the "Lab" half of the wordmark in white instead of
   * the accent color — used on the dark footer band. */
  onDark?: boolean;
}

/** Full lockup: mark + wordmark. Used in the header and footer. */
export function Logo({ size = 28, className = '', onDark = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className={`text-xl font-bold tracking-tight ${onDark ? 'text-white' : 'text-text-primary'}`}>
        BiiA<span className="text-accent">Lab</span>
      </span>
    </span>
  );
}
