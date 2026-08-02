"use client";

import { useEffect, useState } from "react";

type Props = {
  value: string;
  size?: number;
  className?: string;
};

export function CertificateQr({ value, size = 88, className }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const absolute =
          value.startsWith("http")
            ? value
            : `${window.location.origin}${value.startsWith("/") ? "" : "/"}${value}`;
        const QR = await import("qrcode");
        const url = await QR.toDataURL(absolute, {
          width: size * 2,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#0F172A", light: "#FFFFFF" },
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) setDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, background: "#f1f5f9" }}
        aria-hidden
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="" width={size} height={size} className={className} />;
}
