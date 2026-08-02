"use client";

import { signOut } from "next-auth/react";

/** Clears DB session + login log, then signs out of NextAuth. */
export async function signOutFully(options?: {
  callbackUrl?: string;
  reason?: string;
}) {
  try {
    await fetch("/api/auth/clear-session", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: options?.reason ?? "manual" }),
    });
  } catch {
    /* continue to client sign-out */
  }
  await signOut({ callbackUrl: options?.callbackUrl ?? "/" });
}
