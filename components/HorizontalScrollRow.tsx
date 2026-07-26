"use client";

import type { ReactNode } from "react";
import { SectionCarousel } from "@/components/SectionCarousel";

type Props = {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
};

/** Horizontal scroll row for cards — uses SectionCarousel without chrome by default. */
export function HorizontalScrollRow({ children, className = "", trackClassName = "" }: Props) {
  return (
    <SectionCarousel
      className={className}
      trackClassName={trackClassName}
      intervalSeconds={0}
      showControls={false}
    >
      {children}
    </SectionCarousel>
  );
}
