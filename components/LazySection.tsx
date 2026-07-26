"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Defers mounting children until the section nears the viewport.
 * Keeps a lightweight placeholder so layout/scroll position stay stable.
 */
export function LazySection({
  children,
  rootMargin = "280px 0px",
  minHeight = 280,
  className = "",
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  const style: CSSProperties | undefined = visible ? undefined : { minHeight };

  return (
    <div ref={ref} className={className} style={style}>
      {visible ? children : <div aria-hidden className="h-full w-full" style={{ minHeight }} />}
    </div>
  );
}
