"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthInput, AuthPasswordInput, AuthShell } from "@/components/AuthShell";
import { useT } from "@/components/LocaleProvider";

export default function ForgotPasswordPage() {
  const t = useT();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          oldPassword: oldPassword || undefined,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("auth.forgot.sendFailed", "Failed to send request"));
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("auth.forgot.connectionError", "Connection error occurred"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell
        variant="forgot"
        title={t("auth.forgot.sentTitle", "Request sent")}
        subtitle={t(
          "auth.forgot.sentDescription",
          "Your password-change request has been sent to admin. Your data will be updated within hours. Thanks for your patience.",
        )}
      >
        <Link
          href="/login"
          className="mt-2 block w-full rounded-xl bg-[#2563EB] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          {t("auth.forgot.backToLogin", "Back to login")}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      variant="forgot"
      title={t("auth.forgot.title", "Forgot password / Request account update")}
      subtitle={t(
        "auth.forgot.subtitle",
        "Enter your registered email or phone and your new password. The request will be sent to admin and handled within hours.",
      )}
      footer={
        <Link href="/login" className="font-semibold text-[#2563EB] hover:underline">
          {t("auth.forgot.backToLogin", "Back to login")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}
        <div>
          <label htmlFor="emailOrPhone" className="block text-sm font-medium text-slate-800">
            {t("auth.forgot.emailOrPhoneLabel", "Email or phone number")}
          </label>
          <AuthInput
            id="emailOrPhone"
            type="text"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            placeholder={t("auth.forgot.emailOrPhonePlaceholder", "example@email.com or 01xxxxxxxxx")}
            autoComplete="username"
          />
        </div>
        <AuthPasswordInput
          id="oldPassword"
          label={t("auth.forgot.oldPasswordLabel", "Current password (optional if remembered)")}
          value={oldPassword}
          onChange={setOldPassword}
          placeholder={t("auth.forgot.oldPasswordPlaceholder", "Shown to admin if provided")}
          autoComplete="current-password"
        />
        <AuthPasswordInput
          id="newPassword"
          label={t("auth.forgot.newPasswordLabel", "New password")}
          value={newPassword}
          onChange={setNewPassword}
          required
          minLength={6}
          placeholder={t("auth.forgot.newPasswordPlaceholder", "At least 6 characters")}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.9)] transition hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {loading ? t("auth.forgot.submitting", "Sending...") : t("auth.forgot.submit", "Send request")}
        </button>
      </form>
    </AuthShell>
  );
}
