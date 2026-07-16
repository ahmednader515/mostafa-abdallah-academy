"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AcademyLogo } from "@/components/AcademyLogo";
import { useT } from "@/components/LocaleProvider";
import { useSiteBrand } from "@/components/SiteBrandProvider";

const BRAND = "Mostafa Abdullah academy";

const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20";

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${INPUT_CLASS} ${className}`} {...rest} />;
}

export function AuthPasswordInput({
  id,
  label,
  value,
  onChange,
  required,
  minLength,
  placeholder,
  autoComplete = "current-password",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
}) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${INPUT_CLASS} mt-0 pe-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700"
          aria-label={
            visible
              ? t("auth.hidePassword", "Hide password")
              : t("auth.showPassword", "Show password")
          }
        >
          {visible ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function AuthShell({
  variant,
  title,
  subtitle,
  children,
  footer,
}: {
  variant: "login" | "register" | "forgot";
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  const { headerLogoUrl, platformName } = useSiteBrand();
  const displayName = platformName || BRAND;

  const brandHeadline =
    variant === "register"
      ? t("auth.brand.registerHeadline", "انضم إلى أكاديمية القيادة")
      : variant === "forgot"
        ? t("auth.brand.forgotHeadline", "استعادة الوصول لحسابك")
        : t("auth.brand.loginHeadline", "مرحباً بك مرة أخرى");

  const brandBody =
    variant === "register"
      ? t(
          "auth.brand.registerBody",
          "ابدأ مسارك في السياحة والسفر والضيافة الجوية مع مدربين محترفين.",
        )
      : variant === "forgot"
        ? t(
            "auth.brand.forgotBody",
            "سنساعدك على تحديث بياناتك والعودة للتعلم بسرعة وأمان.",
          )
        : t(
            "auth.brand.loginBody",
            "من القاعة إلى قمرة القيادة — واصل رحلتك التعليمية باحتراف.",
          );

  return (
    <div className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="auth-page-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="auth-page-orb auth-page-orb-a pointer-events-none absolute -start-24 top-16 h-72 w-72 rounded-full" aria-hidden />
      <div className="auth-page-orb auth-page-orb-b pointer-events-none absolute -end-16 bottom-10 h-80 w-80 rounded-full" aria-hidden />

      <div className="auth-card relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_30px_80px_-28px_rgba(15,23,42,0.45)] md:grid-cols-2">
        <aside className="auth-brand relative flex flex-col justify-center px-8 py-10 text-white sm:px-10 md:py-14">
          <div className="auth-brand-glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 flex flex-col items-center text-center">
            <Link href="/" className="group inline-flex flex-col items-center gap-4">
              {headerLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerLogoUrl}
                  alt={displayName}
                  className="h-24 w-24 rounded-full border-2 border-[#F59E0B]/50 object-cover shadow-lg transition duration-300 group-hover:scale-105 sm:h-28 sm:w-28 md:h-32 md:w-32"
                />
              ) : (
                <AcademyLogo
                  className="h-24 w-24 transition duration-300 group-hover:scale-105 sm:h-28 sm:w-28 md:h-32 md:w-32"
                  title={displayName}
                />
              )}
              <span className="text-base font-semibold tracking-tight sm:text-lg">
                {platformName ? (
                  <span className="text-white">{platformName}</span>
                ) : (
                  <>
                    <span className="text-white">Mostafa Abdullah</span>{" "}
                    <span className="text-[#F59E0B]">academy</span>
                  </>
                )}
              </span>
            </Link>
            <h2 className="auth-brand-title mt-8 text-2xl font-bold leading-snug sm:text-3xl">
              {brandHeadline}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-200/90 sm:text-[0.95rem]">
              {brandBody}
            </p>
          </div>
        </aside>

        <div className="relative flex flex-col bg-white px-6 py-8 sm:px-10 sm:py-10">
          <Link
            href="/"
            className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            aria-label={t("auth.backHome", "Back to home")}
          >
            <svg className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-6 flex-1">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm text-slate-500">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
