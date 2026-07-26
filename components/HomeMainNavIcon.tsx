import type { HomepageMainNavIcon } from "@/lib/homepage-hero-stats";

const common = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeMainNavIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: HomepageMainNavIcon;
  className?: string;
}) {
  switch (icon) {
    case "briefcase":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect {...common} x="3" y="8" width="18" height="12" rx="2" />
          <path {...common} d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path {...common} d="M3 13h18" />
        </svg>
      );
    case "play":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M10 9.5 16 12l-6 2.5v-5z" />
        </svg>
      );
    case "book":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
          <path {...common} d="M4 5.5V21" />
        </svg>
      );
    case "share":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="18" cy="5" r="2.5" />
          <circle {...common} cx="6" cy="12" r="2.5" />
          <circle {...common} cx="18" cy="19" r="2.5" />
          <path {...common} d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="9" cy="8" r="3" />
          <circle {...common} cx="17" cy="9" r="2.5" />
          <path {...common} d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
          <path {...common} d="M14 15.2c1.1-.7 2.4-1 3.7-1 1.6 0 3 .5 4 1.6" />
        </svg>
      );
    case "globe":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "chat":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M21 12a8 8 0 0 1-8 8H6l-3 3v-8a8 8 0 1 1 18-3z" />
        </svg>
      );
    case "link":
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.7 5.23" />
          <path {...common} d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07L13.3 18.77" />
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
