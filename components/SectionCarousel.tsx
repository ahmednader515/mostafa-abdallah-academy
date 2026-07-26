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
import { useT } from "@/components/LocaleProvider";

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(intervalSeconds > 0);
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
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
  /** Suppress the click that follows a drag gesture. */
  const suppressClickRef = useRef(false);

  const scrollByCards = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!playing || intervalSeconds <= 0) return;
    setSecondsLeft(intervalSeconds);
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          scrollByCards(1);
          return intervalSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [playing, intervalSeconds, scrollByCards]);

  function onPointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    // Don't steal pointer from form controls; links/cards still allow drag-to-scroll.
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
    }
  }

  function onClickCapture(e: ReactMouseEvent) {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  }

  return (
    <div className={`relative ${className}`}>
      {showControls ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl font-bold text-[var(--color-foreground)] shadow-sm hover:bg-[var(--color-primary)] hover:text-white"
              aria-label={t("carousel.prev", "Previous")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl font-bold text-[var(--color-foreground)] shadow-sm hover:bg-[var(--color-primary)] hover:text-white"
              aria-label={t("carousel.next", "Next")}
            >
              ›
            </button>
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

      <div
        ref={scrollerRef}
        className="-mx-4 cursor-grab overflow-x-auto px-4 pb-2 [scrollbar-width:thin] active:cursor-grabbing sm:-mx-0 sm:px-0 [&_a]:cursor-pointer [&_button]:cursor-pointer"
        style={{ WebkitOverflowScrolling: "touch" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        <div className={`flex w-max gap-5 ${trackClassName}`}>{children}</div>
      </div>
    </div>
  );
}
