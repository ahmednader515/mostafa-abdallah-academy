"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useLocale, useT } from "@/components/LocaleProvider";

type Props = {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  /** Autoplay interval in seconds (0 = off) */
  intervalSeconds?: number;
  moreHref?: string;
  moreLabel?: string;
  showControls?: boolean;
};

const DRAG_THRESHOLD_PX = 8;

export function SectionCarousel({
  children,
  className = "",
  trackClassName = "",
  intervalSeconds = 5,
  moreHref,
  moreLabel,
  showControls = true,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(intervalSeconds > 0);
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
  const [canGoLeft, setCanGoLeft] = useState(false);
  const [canGoRight, setCanGoRight] = useState(false);
  const drag = useRef<{
    active: boolean;
    dragged: boolean;
    startX: number;
    startScroll: number;
  }>({
    active: false,
    dragged: false,
    startX: 0,
    startScroll: 0,
  });
  const suppressClickRef = useRef(false);

  const updateNavState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    if (maxScroll <= 4) {
      setCanGoLeft(false);
      setCanGoRight(false);
      return;
    }
    const left = el.scrollLeft;
    // Chrome RTL often uses 0 at start and negative scrollLeft while scrolling.
    if (left < 0 || (isRtl && getComputedStyle(el).direction === "rtl")) {
      const abs = Math.abs(left);
      setCanGoLeft(abs < maxScroll - 4);
      setCanGoRight(abs > 4);
      return;
    }
    setCanGoLeft(left > 4);
    setCanGoRight(left < maxScroll - 4);
  }, [isRtl]);

  /** Move content visually toward the left (-1) or right (+1) of the screen. */
  const scrollVisual = useCallback(
    (visualDir: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el) return;
      const amount = Math.max(260, Math.floor(el.clientWidth * 0.85));
      el.scrollBy({ left: visualDir * amount, behavior: "smooth" });
      window.setTimeout(updateNavState, 350);
    },
    [updateNavState],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateNavState();
    el.addEventListener("scroll", updateNavState, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateNavState) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", updateNavState);
      ro?.disconnect();
    };
  }, [updateNavState, children]);

  useEffect(() => {
    if (!playing || intervalSeconds <= 0) return;
    setSecondsLeft(intervalSeconds);
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Autoplay advances in reading order
          scrollVisual(isRtl ? -1 : 1);
          return intervalSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [playing, intervalSeconds, isRtl, scrollVisual]);

  function onPointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, button")) return;

    drag.current = {
      active: true,
      dragged: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
    };
    suppressClickRef.current = false;
  }

  function onPointerMove(e: ReactPointerEvent) {
    const el = scrollerRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.dragged) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      drag.current.dragged = true;
      suppressClickRef.current = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    el.scrollLeft = drag.current.startScroll - dx;
  }

  function onPointerUp(e: ReactPointerEvent) {
    const el = scrollerRef.current;
    if (!el) return;
    const wasDrag = drag.current.dragged;
    drag.current.active = false;
    drag.current.dragged = false;
    if (wasDrag) {
      suppressClickRef.current = true;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      updateNavState();
    }
  }

  function onClickCapture(e: ReactMouseEvent) {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  }

  const arrowBtnClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl font-bold text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-primary)] hover:text-white disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className={`relative ${className}`}>
      {showControls && (intervalSeconds > 0 || moreHref) ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {intervalSeconds > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
                >
                  {playing
                    ? t("carousel.pause", "Pause")
                    : t("carousel.play", "Play")}
                </button>
                <span className="text-xs text-[var(--color-muted)]">
                  {t("carousel.nextIn", "Next in")} {playing ? secondsLeft : "—"}s
                </span>
              </>
            ) : null}
          </div>
          {moreHref ? (
            <Link
              href={moreHref}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              {moreLabel || t("carousel.viewMore", "View more")}
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* dir=ltr keeps left/right arrows visually stable; track itself is RTL when Arabic */}
      <div className="flex items-center gap-3 sm:gap-4" dir="ltr">
        {showControls ? (
          <button
            type="button"
            onClick={() => scrollVisual(-1)}
            disabled={!canGoLeft}
            className={arrowBtnClass}
            aria-label={isRtl ? t("carousel.next", "Next") : t("carousel.prev", "Previous")}
          >
            ‹
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          dir={isRtl ? "rtl" : "ltr"}
          className="min-w-0 flex-1 cursor-grab overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden [&_a]:cursor-pointer [&_button]:cursor-pointer"
          style={{ WebkitOverflowScrolling: "touch" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
        >
          <div className={`flex w-max gap-5 ${trackClassName}`}>{children}</div>
        </div>

        {showControls ? (
          <button
            type="button"
            onClick={() => scrollVisual(1)}
            disabled={!canGoRight}
            className={arrowBtnClass}
            aria-label={isRtl ? t("carousel.prev", "Previous") : t("carousel.next", "Next")}
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
