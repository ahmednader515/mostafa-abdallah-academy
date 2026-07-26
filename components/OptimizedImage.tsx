"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

function canOptimize(src: string): boolean {
  if (!src || src.startsWith("data:")) return false;
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return (
      host.endsWith(".r2.dev") ||
      host.endsWith(".r2.cloudflarestorage.com") ||
      host.endsWith("cloudflare.com") ||
      host === "localhost"
    );
  } catch {
    return false;
  }
}

/** next/image when the host is allowed; otherwise a lazy native img. */
export function OptimizedImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority = false,
  quality = 72,
  style,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  style?: CSSProperties;
}) {
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (!canOptimize(trimmed)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmed}
        alt={alt}
        className={className}
        style={style}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={trimmed}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        className={className}
        style={style}
        priority={priority}
        quality={quality}
      />
    );
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      width={width ?? 640}
      height={height ?? 360}
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      quality={quality}
    />
  );
}
