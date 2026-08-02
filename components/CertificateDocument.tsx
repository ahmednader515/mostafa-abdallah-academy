import type { CertificateTemplate } from "@/lib/certificate-templates-db";
import { CertificateQr } from "@/components/certificates/CertificateQr";

/** توافق قديم مع الشكل المبسط */
export type CertificateDesignTheme = {
  primaryColor: string;
  accentColor: string;
  goldColor: string;
  bgColor?: string;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  signatureLabel?: string | null;
  showScore?: boolean;
  showPattern?: boolean;
  showQr?: boolean;
  showSeal?: boolean;
  borderWidth?: number;
  orientation?: "landscape" | "portrait";
  frameStyle?: "solid" | "double" | "ornate";
  fontFamily?: string;
  sealUrl?: string | null;
  sealWidthPct?: number;
  sealXPct?: number;
  sealYPct?: number;
  logoWidthPct?: number;
  logoYPct?: number;
  signatures?: CertificateTemplate["signatures"];
};

type CertificateDocumentProps = {
  studentName: string;
  courseTitle: string;
  score: number | null;
  issuedAt: Date | string;
  certificateId: string;
  academyName: string;
  locale: "ar" | "en";
  verifyUrl: string;
  labels: {
    eyebrow: string;
    title: string;
    awardedTo: string;
    completionText: string;
    withScore: string;
    issuedOn: string;
    certificateIdLabel: string;
  };
  design?: CertificateDesignTheme | CertificateTemplate | null;
};

const DEFAULTS = {
  primaryColor: "#0F172A",
  accentColor: "#2563EB",
  goldColor: "#F59E0B",
  bgColor: "#FFFFFF",
  borderWidth: 6,
  showScore: true,
  showPattern: true,
  showQr: true,
  showSeal: false,
  orientation: "portrait" as const,
  frameStyle: "solid" as const,
  fontFamily: "Cairo",
  logoWidthPct: 14,
  logoYPct: 8,
};

function asTheme(design?: CertificateDesignTheme | CertificateTemplate | null): CertificateDesignTheme {
  if (!design) return { ...DEFAULTS };
  const d = design as CertificateDesignTheme & CertificateTemplate;
  const signatures =
    d.signatures?.length
      ? d.signatures
      : d.signatureUrl || d.signatureLabel
        ? [
            {
              imageUrl: d.signatureUrl ?? null,
              nameAr: d.signatureLabel ?? null,
              nameEn: d.signatureLabel ?? null,
              titleAr: null,
              titleEn: null,
              widthPct: 18,
              xPct: 50,
              yPct: 82,
            },
          ]
        : [];
  return {
    primaryColor: d.primaryColor || DEFAULTS.primaryColor,
    accentColor: d.accentColor || DEFAULTS.accentColor,
    goldColor: d.goldColor || DEFAULTS.goldColor,
    bgColor: d.bgColor || DEFAULTS.bgColor,
    logoUrl: d.logoUrl,
    showScore: d.showScore ?? DEFAULTS.showScore,
    showPattern: d.showPattern ?? DEFAULTS.showPattern,
    showQr: d.showQr ?? DEFAULTS.showQr,
    showSeal: d.showSeal ?? DEFAULTS.showSeal,
    borderWidth: d.borderWidth ?? DEFAULTS.borderWidth,
    orientation: d.orientation === "landscape" ? "landscape" : "portrait",
    frameStyle: d.frameStyle || DEFAULTS.frameStyle,
    fontFamily: d.fontFamily || DEFAULTS.fontFamily,
    sealUrl: d.sealUrl,
    sealWidthPct: d.sealWidthPct ?? 14,
    sealXPct: d.sealXPct ?? 85,
    sealYPct: d.sealYPct ?? 78,
    logoWidthPct: d.logoWidthPct ?? DEFAULTS.logoWidthPct,
    logoYPct: d.logoYPct ?? DEFAULTS.logoYPct,
    signatures,
  };
}

/** تصميم الشهادة القابل للطباعة/PDF — يدعم القوالب الكاملة */
export function CertificateDocument({
  studentName,
  courseTitle,
  score,
  issuedAt,
  certificateId,
  academyName,
  locale,
  verifyUrl,
  labels,
  design,
}: CertificateDocumentProps) {
  const theme = asTheme(design);
  const primary = theme.primaryColor!;
  const accent = theme.accentColor!;
  const gold = theme.goldColor!;
  const bg = theme.bgColor || "#FFFFFF";
  const borderWidth = theme.borderWidth ?? 6;
  const orientation = theme.orientation || "portrait";
  const frameStyle = theme.frameStyle || "solid";
  const fontFamily = theme.fontFamily || "Cairo";
  const isLandscape = orientation === "landscape";

  const dateObj = typeof issuedAt === "string" ? new Date(issuedAt) : issuedAt;
  const dateLabel = dateObj.toLocaleDateString(locale === "en" ? "en-US" : "ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const aspectClass = isLandscape
    ? "aspect-[297/210] max-w-5xl"
    : "aspect-[210/297] max-w-3xl";

  const borderStyle =
    frameStyle === "double"
      ? { borderStyle: "double" as const, borderWidth: Math.max(borderWidth, 6), borderColor: primary }
      : frameStyle === "ornate"
        ? {
            borderStyle: "solid" as const,
            borderWidth,
            borderColor: gold,
            boxShadow: `inset 0 0 0 3px ${primary}, inset 0 0 0 ${borderWidth + 6}px ${bg}`,
          }
        : { borderStyle: "solid" as const, borderWidth, borderColor: primary };

  return (
    <div
      className={`certificate-print-area relative mx-auto w-full overflow-hidden shadow-2xl ${aspectClass}`}
      style={{
        backgroundColor: bg,
        fontFamily: `"${fontFamily}", "Segoe UI", Tahoma, sans-serif`,
        ...borderStyle,
      }}
      data-orientation={orientation}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {theme.showPattern ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${primary} 0, ${primary} 2px, transparent 2px, transparent 24px)`,
          }}
          aria-hidden
        />
      ) : null}

      <div
        className="absolute inset-x-0 top-0 h-2"
        style={{ background: `linear-gradient(90deg, ${primary}, ${accent}, ${gold})` }}
      />

      {theme.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.logoUrl}
          alt=""
          className="absolute object-contain"
          style={{
            width: `${theme.logoWidthPct}%`,
            top: `${theme.logoYPct}%`,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      ) : (
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: `${Math.max(8, (theme.logoWidthPct ?? 14) * 0.7)}%`,
            aspectRatio: "1",
            top: `${theme.logoYPct}%`,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: gold,
          }}
        >
          <svg className="h-1/2 w-1/2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      )}

      <div
        className={`relative flex h-full flex-col px-[6%] ${isLandscape ? "pb-[8%] pt-[18%]" : "pb-[10%] pt-[22%]"} text-center`}
      >
        <p className="text-[clamp(0.7rem,1.6vw,0.95rem)] font-semibold uppercase tracking-widest" style={{ color: accent }}>
          {academyName}
        </p>
        <p className="mt-2 text-[clamp(0.65rem,1.4vw,0.85rem)] font-medium" style={{ color: "#64748b" }}>
          {labels.eyebrow}
        </p>
        <h1
          className="mt-1 font-extrabold leading-tight"
          style={{ color: primary, fontSize: isLandscape ? "clamp(1.4rem,3.2vw,2.4rem)" : "clamp(1.5rem,4vw,2.6rem)" }}
        >
          {labels.title}
        </h1>

        <p className="mt-6 text-[clamp(0.7rem,1.5vw,0.9rem)]" style={{ color: "#64748b" }}>
          {labels.awardedTo}
        </p>
        <p
          className="mx-auto mt-1 border-b-2 pb-2 font-bold"
          style={{
            color: primary,
            borderColor: gold,
            fontSize: isLandscape ? "clamp(1.3rem,3vw,2.2rem)" : "clamp(1.4rem,3.5vw,2.4rem)",
            maxWidth: "85%",
          }}
        >
          {studentName}
        </p>

        <p
          className="mx-auto mt-5 max-w-[90%] leading-relaxed"
          style={{ color: "#1e293b", fontSize: "clamp(0.8rem,1.7vw,1.1rem)" }}
        >
          {labels.completionText}{" "}
          <span className="font-bold" style={{ color: accent }}>
            {courseTitle}
          </span>
          {theme.showScore && score != null ? (
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
          className="mx-auto mt-auto grid w-full max-w-xl grid-cols-2 gap-4 border-t pt-4 text-[clamp(0.65rem,1.3vw,0.85rem)]"
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
      </div>

      {theme.showSeal && theme.sealUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.sealUrl}
          alt=""
          className="pointer-events-none absolute object-contain opacity-90"
          style={{
            width: `${theme.sealWidthPct}%`,
            left: `${theme.sealXPct}%`,
            top: `${theme.sealYPct}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ) : null}

      {(theme.signatures ?? []).map((sig, i) => {
        const name = locale === "en" ? sig.nameEn || sig.nameAr : sig.nameAr || sig.nameEn;
        const title = locale === "en" ? sig.titleEn || sig.titleAr : sig.titleAr || sig.titleEn;
        if (!sig.imageUrl && !name && !title) return null;
        return (
          <div
            key={i}
            className="absolute flex flex-col items-center text-center"
            style={{
              width: `${sig.widthPct}%`,
              left: `${sig.xPct}%`,
              top: `${sig.yPct}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {sig.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sig.imageUrl} alt="" className="h-auto w-full max-h-16 object-contain" />
            ) : null}
            {name ? (
              <p className="mt-1 border-t pt-1 text-[clamp(0.6rem,1.2vw,0.8rem)] font-semibold" style={{ color: primary, borderColor: "#e2e8f0" }}>
                {name}
              </p>
            ) : null}
            {title ? (
              <p className="text-[clamp(0.55rem,1.1vw,0.75rem)]" style={{ color: "#64748b" }}>
                {title}
              </p>
            ) : null}
          </div>
        );
      })}

      {theme.showQr ? (
        <div className="absolute bottom-[3%] end-[3%] rounded bg-white p-1 shadow-sm">
          <CertificateQr value={verifyUrl} size={isLandscape ? 72 : 80} />
        </div>
      ) : null}
    </div>
  );
}
