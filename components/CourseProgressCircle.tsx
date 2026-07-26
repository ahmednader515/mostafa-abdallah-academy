type CourseProgressCircleProps = { percent: number; size?: number; strokeWidth?: number; className?: string };
export function CourseProgressCircle({ percent, size = 48, strokeWidth = 5, className }: CourseProgressCircleProps) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value}% complete`} className={className}>
    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth={strokeWidth} />
    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} />
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={Math.max(10, size / 4)} fill="currentColor">{value}%</text>
  </svg>;
}
