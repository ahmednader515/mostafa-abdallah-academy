export function ProgressCircle({
  percent,
  size = 64,
  label,
}: {
  percent: number;
  size?: number;
  label?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  return (
    <div className="inline-flex flex-col items-center gap-1" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={label || `${Math.round(p)}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-[var(--color-foreground)] text-[10px] font-bold"
          style={{ fontSize: size * 0.22 }}
        >
          {Math.round(p)}%
        </text>
      </svg>
      {label ? <span className="text-xs text-[var(--color-muted)]">{label}</span> : null}
    </div>
  );
}
