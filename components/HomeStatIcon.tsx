import type { HomepageStatIcon } from "@/lib/homepage-hero-stats";

const common = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeStatIcon({
  icon,
  className = "h-6 w-6",
}: {
  icon: HomepageStatIcon;
  className?: string;
}) {
  switch (icon) {
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="9" cy="8" r="3" />
          <circle {...common} cx="17" cy="9" r="2.5" />
          <path {...common} d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
          <path {...common} d="M14 15.2c1.1-.7 2.4-1 3.7-1 1.6 0 3 .5 4 1.6" />
        </svg>
      );
    case "graduation":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5z" />
          <path {...common} d="M7 12.2v4.3c0 .8 2.2 2 5 2s5-1.2 5-2v-4.3" />
          <path {...common} d="M21 10v5.5" />
        </svg>
      );
    case "bookOpen":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M12 6c-1.8-1.4-4-2-6.5-2H3v14h3c2.3 0 4.3.6 6 2" />
          <path {...common} d="M12 6c1.8-1.4 4-2 6.5-2H21v14h-3c-2.3 0-4.3.6-6 2" />
          <path {...common} d="M12 6v14" />
        </svg>
      );
    case "teacher":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="7" r="3" />
          <path {...common} d="M6.5 20c.7-3.2 2.9-5 5.5-5s4.8 1.8 5.5 5" />
          <path {...common} d="M16.5 9.5 19 8l1.5 3.5" />
          <path {...common} d="M19 8v3.2" />
        </svg>
      );
    case "chalkboard":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect {...common} x="3" y="3" width="18" height="12" rx="1.5" />
          <path {...common} d="M7 7.5h10M7 10.5h6" />
          <path {...common} d="M12 15v4M8 21h8" />
        </svg>
      );
    case "award":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="9" r="5.5" />
          <path {...common} d="m9.2 13.8-1.4 7.2L12 18.5l4.2 2.5-1.4-7.2" />
          <path {...common} d="M10 8.2 12 7l2 1.2" />
        </svg>
      );
    case "bulb":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M9 18h6" />
          <path {...common} d="M10 22h4" />
          <path {...common} d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5C9.5 16 9 15 8 14z" />
        </svg>
      );
    case "play":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M10 9.5 16 12l-6 2.5v-5z" />
        </svg>
      );
    case "monitor":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect {...common} x="3" y="4" width="18" height="12" rx="2" />
          <path {...common} d="M8 20h8M12 16v4" />
        </svg>
      );
    case "certificate":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M7 4h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4l-3 3v-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <circle {...common} cx="12" cy="9" r="2.2" />
        </svg>
      );
    case "target":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="8" />
          <circle {...common} cx="12" cy="12" r="4" />
          <circle {...common} cx="12" cy="12" r="1.2" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
