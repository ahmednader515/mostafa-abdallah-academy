"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginBackground from "@/app/login/LoginBackground";
import { PhoneNumberInput, DEFAULT_PHONE_COUNTRY } from "@/components/PhoneNumberInput";
import { useLocale, useT } from "@/components/LocaleProvider";
import { validatePhoneForCountry } from "@/lib/phone/countries";

export default function RegisterPage() {
  const t = useT();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [phoneNational, setPhoneNational] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const phoneCheck = validatePhoneForCountry(phoneCountry, phoneNational);
    if (!phoneCheck.ok) {
      setError(locale === "ar" ? phoneCheck.messageAr : phoneCheck.messageEn);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        phone_country: phoneCountry,
        phone_national: phoneNational,
        student_number: phoneCheck.stored,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("auth.register.createFailed", "Failed to create account"));
      return;
    }
    router.push(`/login?message=${encodeURIComponent(t("auth.register.signupSuccessMessage", "Account created successfully, you can now log in"))}`);
    router.refresh();
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-none items-center justify-center overflow-hidden bg-black px-4 py-12">
      <LoginBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/55" />
      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {t("auth.register.title", "Create account")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("auth.register.subtitle", "Register as a student to access courses and learn")}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--color-foreground)]"
            >
              {t("auth.register.nameLabel", "Name")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder={t("auth.register.namePlaceholder", "Ahmed Mohamed")}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--color-foreground)]"
            >
              {t("auth.register.emailLabel", "Email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="student_number"
              className="block text-sm font-medium text-[var(--color-foreground)]"
            >
              {t("auth.register.phoneLabel", "Phone number")}
            </label>
            <PhoneNumberInput
              id="student_number"
              countryCode={phoneCountry}
              nationalValue={phoneNational}
              onCountryChange={setPhoneCountry}
              onNationalChange={setPhoneNational}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--color-foreground)]"
            >
              {t("auth.register.passwordLabel", "Password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder={t("auth.register.passwordPlaceholder", "At least 6 characters")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2.5 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {loading ? t("auth.register.submitting", "Creating account...") : t("auth.register.submit", "Create account")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {t("auth.register.hasAccount", "Already have an account?")}{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("auth.register.login", "Log in")}
          </Link>
        </p>
      </div>
    </div>
  );
}
