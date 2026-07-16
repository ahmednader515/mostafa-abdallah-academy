"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CONCURRENT_SESSION_ERROR } from "@/lib/auth-constants";
import { AuthInput, AuthPasswordInput, AuthShell } from "@/components/AuthShell";
import { useT } from "@/components/LocaleProvider";

function LoginForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [concurrentSession, setConcurrentSession] = useState(false);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const reasonElsewhere = searchParams.get("reason") === "session_ended_elsewhere";
  const successMessage = searchParams.get("message");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConcurrentSession(false);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error === CONCURRENT_SESSION_ERROR) {
        setConcurrentSession(true);
        setLoading(false);
        return;
      }
      if (res?.error) {
        setError(t("auth.login.invalidCredentials", "Email/phone or password is incorrect"));
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleForceLogoutOther(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForceLogoutLoading(true);
    try {
      const r = await fetch("/api/auth/force-logout-other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error ?? t("auth.login.forceLogoutFailed", "Failed to log out the other device"));
        return;
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(t("auth.login.loginAfterForceLogoutFailed", "Failed to log in after logging out the other device"));
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setForceLogoutLoading(false);
    }
  }

  if (concurrentSession) {
    return (
      <AuthShell
        variant="login"
        title={t("auth.login.concurrentTitle", "This account is active on another device")}
        subtitle={t(
          "auth.login.concurrentDescription",
          "This account is currently logged in from another device or browser. To continue here, log out the other device first.",
        )}
      >
        <p className="text-sm leading-relaxed text-slate-600">
          {t(
            "auth.login.concurrentSecurityHint",
            'If you suspect your account was compromised, update your password and account details from "Edit account" after logging in.',
          )}
        </p>
        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}
        <form onSubmit={handleForceLogoutOther} className="mt-6">
          <button
            type="submit"
            disabled={forceLogoutLoading}
            className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {forceLogoutLoading
              ? t("auth.login.concurrentActionLoading", "Processing...")
              : t("auth.login.concurrentAction", "Log out the other device and continue here")}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConcurrentSession(false)}
          className="mt-4 w-full text-sm text-slate-500 transition hover:text-slate-800 hover:underline"
        >
          {t("auth.login.concurrentCancel", "Cancel and go back to login")}
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      variant="login"
      title={t("auth.login.title", "Log in")}
      subtitle={t("auth.login.subtitle", "Enter your details to access your account")}
      footer={
        <>
          {t("auth.login.noAccount", "Don't have an account?")}{" "}
          <Link href="/register" className="font-semibold text-[#2563EB] transition hover:text-[#1d4ed8]">
            {t("auth.login.createAccount", "Create account")}
          </Link>
        </>
      }
    >
      {reasonElsewhere ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t(
            "auth.login.sessionEndedElsewhere",
            "You were logged out because this account was opened on another device. Log in again here if you want.",
          )}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-800">
            {t("auth.login.emailOrPhoneLabel", "Email or phone number")}
          </label>
          <AuthInput
            id="email"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t("auth.login.emailOrPhonePlaceholder", "example@email.com or 01xxxxxxxxx")}
          />
        </div>
        <div>
          <AuthPasswordInput
            id="password"
            label={t("auth.login.passwordLabel", "Password")}
            value={password}
            onChange={setPassword}
            required
          />
          <p className="mt-2 text-start text-xs">
            <Link href="/login/forgot-password" className="font-medium text-[#2563EB] hover:underline">
              {t("auth.login.forgotPassword", "Forgot password?")}
            </Link>
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.9)] transition hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {loading ? t("auth.login.submitting", "Logging in...") : t("auth.login.submit", "Log in")}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthFallback() {
  return (
    <div className="auth-page relative flex min-h-screen items-center justify-center px-4">
      <div className="auth-page-bg absolute inset-0" aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white p-8 shadow-xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginForm />
    </Suspense>
  );
}
