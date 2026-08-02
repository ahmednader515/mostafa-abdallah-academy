import type { ReactNode, SVGProps } from "react";

const paths: Record<string, (props: SVGProps<SVGSVGElement>) => ReactNode> = {
  chat: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 16.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9.2L5 19v-2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  plane: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3 12.5 21 4l-4.5 16-4-5.5L8 17l-.5-4.5L3 12.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  briefcase: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1M4 7h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  book: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M5 18.5h12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  mic: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  globe: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12h16M12 4c2.5 2.8 2.5 12.2 0 16M12 4c-2.5 2.8-2.5 12.2 0 16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  ticket: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 8.5A2.5 2.5 0 0 0 6.5 11 2.5 2.5 0 0 0 4 13.5v3A1.5 1.5 0 0 0 5.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-3A2.5 2.5 0 0 0 17.5 11 2.5 2.5 0 0 0 20 8.5v-3A1.5 1.5 0 0 0 18.5 4h-13A1.5 1.5 0 0 0 4 5.5v3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  ship: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 14.5 12 8l8 6.5M6 18h12l1.5-3.5H4.5L6 18Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 8V5M9.5 5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  docs: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M8 4h7l3 3v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 4v3h3M10 11h6M10 14h6M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 18.5c.8-2.5 2.8-4 5.5-4s4.7 1.5 5.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.2 18.5c.4-1.6 1.6-2.8 3.3-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

export function ForumCategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const key = name && paths[name] ? name : "chat";
  const Icon = paths[key];
  return <>{Icon({ className: className ?? "h-5 w-5" })}</>;
}
