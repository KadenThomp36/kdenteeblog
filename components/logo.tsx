export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Stem */}
      <rect
        x="112"
        y="80"
        width="56"
        height="352"
        rx="4"
        className="fill-foreground"
      />
      {/* Upper arm — vermillion accent */}
      <polygon
        points="168,224 168,288 384,80 384,144"
        className="fill-primary"
      />
      {/* Lower arm */}
      <polygon
        points="168,224 168,288 384,432 384,368"
        className="fill-foreground"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={24} />
      <span className="font-display text-2xl tracking-tight">KdenTee</span>
    </span>
  );
}
