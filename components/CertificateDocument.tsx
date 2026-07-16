export type CertificateDesignTheme = {
  primaryColor: string;
  accentColor: string;
  goldColor: string;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  signatureLabel?: string | null;
  showScore?: boolean;
  showPattern?: boolean;
  borderWidth?: number;
};

type CertificateDocumentProps = {
  studentName: string;
  courseTitle: string;
  score: number | null;
  issuedAt: Date | string;
  certificateId: string;
  academyName: string;
  locale: "ar" | "en";
  labels: {
    eyebrow: string;
    title: string;
    awardedTo: string;
    completionText: string;
    withScore: string;
    issuedOn: string;
    certificateIdLabel: string;
  };
  design?: CertificateDesignTheme | null;
};

const DEFAULTS = {
  primaryColor: "#0F172A",
  accentColor: "#2563EB",
  goldColor: "#F59E0B",
  borderWidth: 6,
  showScore: true,
  showPattern: true,
};

/** تصميم الشهادة القابل للطباعة — يدعم تخصيص الألوان والشعار والتوقيع من لوحة التحكم */
export function CertificateDocument({
  studentName,
  courseTitle,
  score,
  issuedAt,
  certificateId,
  academyName,
  locale,
  labels,
  design,
}: CertificateDocumentProps) {
  const primary = design?.primaryColor || DEFAULTS.primaryColor;
  const accent = design?.accentColor || DEFAULTS.accentColor;
  const gold = design?.goldColor || DEFAULTS.goldColor;
  const borderWidth = design?.borderWidth ?? DEFAULTS.borderWidth;
  const showScore = design?.showScore ?? DEFAULTS.showScore;
  const showPattern = design?.showPattern ?? DEFAULTS.showPattern;
  const logoUrl = design?.logoUrl?.trim() || null;
  const signatureUrl = design?.signatureUrl?.trim() || null;
  const signatureLabel = design?.signatureLabel?.trim() || null;

  const dateObj = typeof issuedAt === "string" ? new Date(issuedAt) : issuedAt;
  const dateLabel = dateObj.toLocaleDateString(locale === "en" ? "en-US" : "ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="certificate-print-area relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      style={{ borderStyle: "solid", borderWidth, borderColor: primary }}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {showPattern ? (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${primary} 0, ${primary} 2px, transparent 2px, transparent 24px)`,
          }}
          aria-hidden
        />
      ) : null}
      <div
        className="h-3 w-full"
        style={{ background: `linear-gradient(90deg, ${primary}, ${accent}, ${gold})` }}
      />

      <div className="relative px-8 py-12 text-center sm:px-14 sm:py-16">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="mx-auto mb-6 h-20 w-20 rounded-full border-2 object-cover shadow-md sm:h-24 sm:w-24"
            style={{ borderColor: gold }}
          />
        ) : (
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: gold }}
          >
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        )}

        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accent }}>
          {academyName}
        </p>
        <p className="mt-3 text-sm font-medium" style={{ color: "#64748b" }}>
          {labels.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl" style={{ color: primary }}>
          {labels.title}
        </h1>

        <p className="mt-10 text-sm" style={{ color: "#64748b" }}>
          {labels.awardedTo}
        </p>
        <p
          className="mt-2 border-b-2 pb-3 text-3xl font-bold sm:text-4xl"
          style={{ color: primary, borderColor: gold }}
        >
          {studentName}
        </p>

        <p className="mt-8 text-base leading-relaxed sm:text-lg" style={{ color: "#1e293b" }}>
          {labels.completionText}{" "}
          <span className="font-bold" style={{ color: accent }}>
            {courseTitle}
          </span>
          {showScore && score != null ? (
            <>
              {" "}
              {labels.withScore}{" "}
              <span className="font-bold" style={{ color: gold }}>
                {score}%
              </span>
            </>
          ) : null}
        </p>

        <div
          className="mx-auto mt-12 grid max-w-xl grid-cols-2 gap-6 border-t pt-6 text-sm"
          style={{ borderColor: "#e2e8f0" }}
        >
          <div className="text-start">
            <p style={{ color: "#64748b" }}>{labels.issuedOn}</p>
            <p className="font-semibold" style={{ color: primary }}>
              {dateLabel}
            </p>
          </div>
          <div className="text-end">
            <p style={{ color: "#64748b" }}>{labels.certificateIdLabel}</p>
            <p className="font-mono font-semibold tracking-wide" style={{ color: primary }}>
              {certificateId}
            </p>
          </div>
        </div>

        {signatureUrl || signatureLabel ? (
          <div className="mt-10 flex flex-col items-center">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signatureUrl} alt="" className="h-14 w-auto max-w-[200px] object-contain" />
            ) : null}
            {signatureLabel ? (
              <p className="mt-2 border-t pt-2 text-sm font-medium" style={{ color: primary, borderColor: "#e2e8f0" }}>
                {signatureLabel}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
