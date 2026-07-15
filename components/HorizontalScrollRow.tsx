"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Extra class on the inner flex track */
  trackClassName?: string;
};

/** Horizontal scroll row for cards (sections, library, etc.) */
export function HorizontalScrollRow({ children, className = "", trackClassName = "" }: Props) {
  return (
    <div
      className={`-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:-mx-0 sm:px-0 ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className={`flex w-max gap-5 ${trackClassName}`}>{children}</div>
    </div>
  );
}
