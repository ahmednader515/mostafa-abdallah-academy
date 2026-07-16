"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthInput, AuthPasswordInput, AuthShell } from "@/components/AuthShell";
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
    router.push(
      `/login?message=${encodeURIComponent(
        t("auth.register.signupSuccessMessage", "Account created successfully, you can now log in"),
      )}`,
    );
    router.refresh();
  }

  return (
    <AuthShell
      variant="register"
      title={t("auth.register.title", "Create account")}
      subtitle={t("auth.register.subtitle", "Register as a trainee to access courses and learn")}
      footer={
        <>
          {t("auth.register.hasAccount", "Already have an account?")}{" "}
          <Link href="/login" className="font-semibold text-[#2563EB] transition hover:text-[#1d4ed8]">
            {t("auth.register.login", "Log in")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-800">
            {t("auth.register.nameLabel", "Name")}
          </label>
          <AuthInput
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder={t("auth.register.namePlaceholder", "Ahmed Mohamed")}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-800">
            {t("auth.register.emailLabel", "Email")}
          </label>
          <AuthInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="student_number" className="block text-sm font-medium text-slate-800">
            {t("auth.register.phoneLabel", "Phone number")}
          </label>
          <div className="mt-1.5">
            <PhoneNumberInput
              id="student_number"
              countryCode={phoneCountry}
              nationalValue={phoneNational}
              onCountryChange={setPhoneCountry}
              onNationalChange={setPhoneNational}
              required
            />
          </div>
        </div>
        <AuthPasswordInput
          id="password"
          label={t("auth.register.passwordLabel", "Password")}
          value={password}
          onChange={setPassword}
          required
          minLength={6}
          placeholder={t("auth.register.passwordPlaceholder", "At least 6 characters")}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.9)] transition hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {loading
            ? t("auth.register.submitting", "Creating account...")
            : t("auth.register.submit", "Create account")}
        </button>
      </form>
    </AuthShell>
  );
}
