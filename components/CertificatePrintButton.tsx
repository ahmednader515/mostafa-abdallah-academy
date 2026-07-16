"use client";

export function CertificatePrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="certificate-print-hide inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition hover:bg-[#1d4ed8]"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
        />
      </svg>
      {label}
    </button>
  );
}
