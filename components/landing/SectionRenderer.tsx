"use client";

import Image from "next/image";
import { CtaButton } from "@/components/landing/CtaButton";
import type {
  LandingCtaTargetType,
  LandingSection,
  LandingTheme,
} from "@/lib/landing-page-types";

function isRemote(url: string) {
  return /^https?:\/\//i.test(url);
}

function Media({
  type,
  url,
  className,
}: {
  type: "image" | "video" | "none";
  url?: string;
  className?: string;
}) {
  if (type === "none" || !url) return null;
  if (type === "video") {
    return (
      <video
        className={className || "h-full w-full object-cover"}
        src={url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }
  if (isRemote(url)) {
    return (
      <Image
        src={url}
        alt=""
        width={1200}
        height={675}
        className={className || "h-auto w-full object-cover"}
        unoptimized
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={className || "h-auto w-full object-cover"} />;
}

export function SectionRenderer({
  sections,
  theme,
  pageSlug,
  pageTargetType,
  pageTargetId,
  courseSlugById,
  targetPrice,
}: {
  sections: LandingSection[];
  theme: LandingTheme;
  pageSlug: string;
  pageTargetType: LandingCtaTargetType;
  pageTargetId: string | null;
  courseSlugById?: Record<string, string>;
  targetPrice?: number | null;
}) {
  const visible = sections.filter((s) => s.visible);

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--lp-primary": theme.primaryColor,
          "--lp-bg": theme.backgroundColor,
          "--lp-text": theme.textColor,
          "--lp-button": theme.buttonColor,
          "--lp-button-text": theme.buttonTextColor,
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          backgroundImage: theme.backgroundImageUrl
            ? `url(${theme.backgroundImageUrl})`
            : undefined,
          backgroundSize: theme.backgroundImageUrl ? "cover" : undefined,
          backgroundPosition: "center",
        } as React.CSSProperties
      }
    >
      {theme.backgroundVideoUrl ? (
        <video
          className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover opacity-40"
          src={theme.backgroundVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : null}

      {visible.map((section) => {
        if (section.type === "hero") {
          return (
            <section
              key={section.id}
              className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24"
            >
              <div>
                <h1 className="text-3xl font-bold leading-tight md:text-5xl">{section.title}</h1>
                {section.subtitle ? (
                  <p className="mt-4 text-base opacity-90 md:text-lg">{section.subtitle}</p>
                ) : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  {section.buttons.map((btn) => (
                    <CtaButton
                      key={btn.id}
                      button={btn}
                      pageSlug={pageSlug}
                      pageTargetType={pageTargetType}
                      pageTargetId={pageTargetId}
                      courseSlugById={courseSlugById}
                      defaultColor={theme.buttonColor}
                      defaultTextColor={theme.buttonTextColor}
                    />
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl">
                <Media type={section.mediaType} url={section.mediaUrl} />
              </div>
            </section>
          );
        }

        if (section.type === "features") {
          return (
            <section key={section.id} className="mx-auto max-w-6xl px-4 py-14">
              <h2 className="text-2xl font-bold md:text-3xl">{section.title}</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <div key={item.id} className="rounded-xl bg-white/60 p-5 backdrop-blur dark:bg-black/20">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm opacity-80">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "details") {
          return (
            <section key={section.id} className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">{section.title}</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed opacity-90 md:text-base">
                  {section.body}
                </p>
              </div>
              {section.imageUrl ? (
                <div className="overflow-hidden rounded-2xl">
                  <Media type="image" url={section.imageUrl} />
                </div>
              ) : null}
            </section>
          );
        }

        if (section.type === "instructor") {
          return (
            <section key={section.id} className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-14 text-center md:flex-row md:text-start">
              {section.imageUrl ? (
                <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full">
                  <Media type="image" url={section.imageUrl} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div>
                <p className="text-sm font-medium opacity-70">{section.title}</p>
                <h2 className="mt-1 text-2xl font-bold">{section.name}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm opacity-90">{section.bio}</p>
              </div>
            </section>
          );
        }

        if (section.type === "testimonials") {
          return (
            <section key={section.id} className="mx-auto max-w-6xl px-4 py-14">
              <h2 className="text-2xl font-bold md:text-3xl">{section.title}</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <blockquote
                    key={item.id}
                    className="rounded-xl bg-white/60 p-5 text-sm backdrop-blur dark:bg-black/20"
                  >
                    <p className="whitespace-pre-wrap opacity-90">&ldquo;{item.text}&rdquo;</p>
                    <footer className="mt-3 font-semibold">{item.name}</footer>
                  </blockquote>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "faq") {
          return (
            <section key={section.id} className="mx-auto max-w-3xl px-4 py-14">
              <h2 className="text-2xl font-bold md:text-3xl">{section.title}</h2>
              <div className="mt-6 space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.id}
                    className="rounded-xl bg-white/60 p-4 backdrop-blur open:shadow-sm dark:bg-black/20"
                  >
                    <summary className="cursor-pointer font-semibold">{item.question}</summary>
                    <p className="mt-2 whitespace-pre-wrap text-sm opacity-90">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "pricing") {
          const price =
            section.useTargetPrice && targetPrice != null
              ? targetPrice
              : section.priceAmount;
          return (
            <section key={section.id} className="mx-auto max-w-xl px-4 py-14 text-center">
              <h2 className="text-2xl font-bold md:text-3xl">{section.title}</h2>
              {section.description ? (
                <p className="mt-3 text-sm opacity-80">{section.description}</p>
              ) : null}
              <div className="mt-6">
                {section.originalPriceAmount != null ? (
                  <span className="me-2 text-lg line-through opacity-50">
                    {section.originalPriceAmount}
                  </span>
                ) : null}
                {price != null ? (
                  <span className="text-4xl font-bold" style={{ color: theme.primaryColor }}>
                    {price}
                  </span>
                ) : null}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {section.buttons.map((btn) => (
                  <CtaButton
                    key={btn.id}
                    button={btn}
                    pageSlug={pageSlug}
                    pageTargetType={pageTargetType}
                    pageTargetId={pageTargetId}
                    courseSlugById={courseSlugById}
                    defaultColor={theme.buttonColor}
                    defaultTextColor={theme.buttonTextColor}
                  />
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "signup") {
          return (
            <section
              key={section.id}
              className="mx-auto max-w-3xl px-4 py-16 text-center"
              style={{ backgroundColor: `${theme.primaryColor}14` }}
            >
              <h2 className="text-2xl font-bold md:text-3xl">{section.title}</h2>
              {section.subtitle ? (
                <p className="mt-3 text-sm opacity-90 md:text-base">{section.subtitle}</p>
              ) : null}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {section.buttons.map((btn) => (
                  <CtaButton
                    key={btn.id}
                    button={btn}
                    pageSlug={pageSlug}
                    pageTargetType={pageTargetType}
                    pageTargetId={pageTargetId}
                    courseSlugById={courseSlugById}
                    defaultColor={theme.buttonColor}
                    defaultTextColor={theme.buttonTextColor}
                  />
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
