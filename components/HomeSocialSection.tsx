import type { HomepageSetting } from "@/lib/types";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { listEnabledSocialLinks } from "@/lib/lms-spec-db";

type SocialNetwork =
  | "whatsapp"
  | "facebook"
  | "telegram"
  | "youtube"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "x";

type SocialEntry = {
  href: string;
  network: SocialNetwork;
  label: string;
};

const SOCIAL_COLORS: Record<SocialNetwork, string> = {
  whatsapp: "#25D366",
  facebook: "#1877F2",
  telegram: "#229ED9",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  instagram: "#E4405F",
  tiktok: "#010101",
  x: "#111111",
};

const NETWORK_MAP: Record<string, SocialNetwork> = {
  whatsapp: "whatsapp",
  facebook: "facebook",
  telegram: "telegram",
  youtube: "youtube",
  linkedin: "linkedin",
  instagram: "instagram",
  tiktok: "tiktok",
  x: "x",
  twitter: "x",
};

function SocialIcon({ network }: { network: SocialNetwork }) {
  switch (network) {
    case "whatsapp":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "telegram":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.5 1 .4.4.7.9 1 1.5.2.4.4 1.1.4 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5 1-.4.2-1.1.4-2.3.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-1-1.5-.2-.4-.4-1.1-.4-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.3.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-1 .4-.2 1.1-.4 2.3-.4C8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.2 0-3.5 0-4.8.1-.9 0-1.5.2-1.8.3-.4.2-.7.3-1 .7-.3.3-.5.6-.7 1-.1.3-.3.9-.3 1.8-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c0 .9.2 1.5.3 1.8.2.4.3.7.7 1 .3.3.6.5 1 .7.3.1.9.3 1.8.3 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c.9 0 1.5-.2 1.8-.3.4-.2.7-.3 1-.7.3-.3.5-.6.7-1 .1-.3.3-.9.3-1.8.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c0-.9-.2-1.5-.3-1.8-.2-.4-.3-.7-.7-1-.3-.3-.6-.5-1-.7-.3-.1-.9-.3-1.8-.3-1.3-.1-1.6-.1-4.8-.1zm0 3.1a5 5 0 1 1 0 9.9 5 5 0 0 1 0-9.9zm0 1.8a3.2 3.2 0 1 0 0 6.3 3.2 3.2 0 0 0 0-6.3zm5.2-2.1a1.2 1.2 0 1 1 0 2.3 1.2 1.2 0 0 1 0-2.3z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M19.6 7.2a6.4 6.4 0 0 1-3.8-1.2v7.1a5.4 5.4 0 1 1-4.7-5.3v2.4a3 3 0 1 0 2.2 2.9V2.5h2.5a3.9 3.9 0 0 0 3.8 3.8z" />
        </svg>
      );
    case "x":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.9-6.4L5.4 22H2.6l7-8L2 2h6.4l4.4 5.8L18.2 2zm-1.1 18h1.7L7 3.9H5.2L17.1 20z" />
        </svg>
      );
  }
}

function pushUnique(target: SocialEntry[], seen: Set<string>, entry: SocialEntry) {
  const key = entry.href.trim().toLowerCase();
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push(entry);
}

function collectHomepageLinks(settings: HomepageSetting): {
  right: SocialEntry[];
  left: SocialEntry[];
} {
  const right: SocialEntry[] = [];
  const left: SocialEntry[] = [];
  const pairs: Array<{
    href?: string | null;
    network: SocialNetwork;
    label: string;
    side: "right" | "left";
  }> = [
    { href: settings.whatsappUrl, network: "whatsapp", label: "WhatsApp", side: "right" },
    { href: settings.facebookUrl, network: "facebook", label: "Facebook", side: "right" },
    { href: settings.telegramUrl, network: "telegram", label: "Telegram", side: "right" },
    { href: settings.youtubeUrl, network: "youtube", label: "YouTube", side: "right" },
    { href: settings.linkedinUrl, network: "linkedin", label: "LinkedIn", side: "right" },
    { href: settings.teamYoutubeUrl, network: "youtube", label: "YouTube", side: "left" },
    { href: settings.teamLinkedinUrl, network: "linkedin", label: "LinkedIn", side: "left" },
    { href: settings.teamWhatsappUrl, network: "whatsapp", label: "WhatsApp", side: "left" },
    { href: settings.teamFacebookUrl, network: "facebook", label: "Facebook", side: "left" },
    { href: settings.teamTelegramUrl, network: "telegram", label: "Telegram", side: "left" },
  ];
  for (const p of pairs) {
    const href = p.href?.trim();
    if (!href) continue;
    if (p.side === "right") right.push({ href, network: p.network, label: p.label });
    else left.push({ href, network: p.network, label: p.label });
  }
  return { right, left };
}

function LinkRow({ links }: { links: SocialEntry[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {links.map((link) => (
        <a
          key={`${link.network}-${link.href}`}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={link.label}
          aria-label={link.label}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition hover:scale-105 hover:opacity-90"
          style={{ backgroundColor: SOCIAL_COLORS[link.network] }}
        >
          <SocialIcon network={link.network} />
        </a>
      ))}
    </div>
  );
}

export async function HomeSocialSection({ settings }: { settings: HomepageSetting }) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { right, left } = collectHomepageLinks(settings);
  const showLeft = settings.socialLeftEnabled !== false && left.length > 0;

  const adminLinks: SocialEntry[] = [];
  try {
    const enabled = await listEnabledSocialLinks();
    for (const link of enabled) {
      const network = NETWORK_MAP[String(link.network || "").toLowerCase()];
      const href = link.url?.trim();
      if (!network || !href) continue;
      adminLinks.push({
        href,
        network,
        label:
          pickLocalizedText(locale, link.label, link.labelEn) ||
          network.charAt(0).toUpperCase() + network.slice(1),
      });
    }
  } catch {
    /* ignore */
  }

  const allLinks: SocialEntry[] = [];
  const seen = new Set<string>();
  for (const link of adminLinks) pushUnique(allLinks, seen, link);
  for (const link of right) pushUnique(allLinks, seen, link);
  if (showLeft) {
    for (const link of left) pushUnique(allLinks, seen, link);
  }

  if (allLinks.length === 0) return null;

  const rightLabel = pickLocalizedText(locale, settings.socialRightLabel, settings.socialRightLabelEn);
  const leftLabel = pickLocalizedText(locale, settings.socialLeftLabel, settings.socialLeftLabelEn);

  // Prefer one unified row of every unique link (admin + homepage).
  // Keep optional group labels only when homepage groups exist and no admin links.
  const useGrouped = adminLinks.length === 0 && (right.length > 0 || showLeft);

  return (
    <section
      id="home-social"
      className="scroll-mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 sm:px-6"
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
          {t("home.mainNav.social", "وسائل التواصل")}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t("home.socialSubtitle", "تواصل معنا عبر القنوات التالية")}
        </p>

        {useGrouped ? (
          <>
            {right.length > 0 ? (
              <div className="mt-8">
                {rightLabel ? (
                  <p className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
                    {rightLabel}
                  </p>
                ) : null}
                <LinkRow links={right} />
              </div>
            ) : null}
            {showLeft ? (
              <div className="mt-8">
                {leftLabel ? (
                  <p className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
                    {leftLabel}
                  </p>
                ) : null}
                <LinkRow links={left} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-8">
            <LinkRow links={allLinks} />
          </div>
        )}
      </div>
    </section>
  );
}
