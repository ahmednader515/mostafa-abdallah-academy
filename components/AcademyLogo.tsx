export function AcademyLogo({
  className = "h-10 w-10",
  title = "Mostafa Abdullah academy",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <circle cx="32" cy="32" r="30" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" />
      <path
        d="M6 30c6-10 12-14 18-14 2 0 3.5 1 4.5 2.5C26 14 22 10 16 8c-2-.5-3 1.5-2 3 2 3 4 6 4 10-4 1-8 4-12 9z"
        fill="#F8FAFC"
        opacity="0.95"
      />
      <path
        d="M58 30c-6-10-12-14-18-14-2 0-3.5 1-4.5 2.5C38 14 42 10 48 8c2-.5 3 1.5 2 3-2 3-4 6-4 10 4 1 8 4 12 9z"
        fill="#F8FAFC"
        opacity="0.95"
      />
      <path
        d="M20 44V22l12 14 12-14v22h-5.5V32.5L32 42.5 25.5 32.5V44H20z"
        fill="#F59E0B"
      />
    </svg>
  );
}
