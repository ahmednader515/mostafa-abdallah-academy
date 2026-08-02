"use client";

import { useState } from "react";
import { CertificatePrintButton } from "@/components/CertificatePrintButton";

type Props = {
  shareUrl: string;
  certificateId: string;
  orientation: "landscape" | "portrait";
  copyLabel: string;
  copiedLabel: string;
  downloadPdfLabel: string;
  downloadingLabel: string;
  printLabel: string;
  downloadFailedLabel: string;
};

export function CertificateActions({
  shareUrl,
  certificateId,
  orientation,
  copyLabel,
  copiedLabel,
  downloadPdfLabel,
  downloadingLabel,
  printLabel,
  downloadFailedLabel,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleCopy() {
    setError("");
    try {
      const absolute =
        shareUrl.startsWith("http") ? shareUrl : `${window.location.origin}${shareUrl.startsWith("/") ? "" : "/"}${shareUrl}`;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(downloadFailedLabel);
    }
  }

  async function handlePdf() {
    setError("");
    setDownloading(true);
    try {
      const el = document.querySelector(".certificate-print-area") as HTMLElement | null;
      if (!el) throw new Error("missing");
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: orientation === "landscape" ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pageW / imgW, pageH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save(`${certificateId}.pdf`);
    } catch {
      setError(downloadFailedLabel);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="certificate-print-hide flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/40"
      >
        {copied ? copiedLabel : copyLabel}
      </button>
      <button
        type="button"
        onClick={() => void handlePdf()}
        disabled={downloading}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {downloading ? downloadingLabel : downloadPdfLabel}
      </button>
      <CertificatePrintButton label={printLabel} />
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
