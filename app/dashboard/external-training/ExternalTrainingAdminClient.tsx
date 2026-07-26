"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { ExternalTrainingPage } from "@/lib/lms-features-db";

export function ExternalTrainingAdminClient({
  initialPages,
}: {
  initialPages: ExternalTrainingPage[];
}) {
  const t = useT();
  const [pages, setPages] = useState(initialPages);
  const [title, setTitle] = useState("");
  const [launchUrl, setLaunchUrl] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("{}");
  const [error, setError] = useState("");

  async function reload() {
    const r = await fetch("/api/dashboard/external-training");
    const d = await r.json();
    if (r.ok) setPages(d.pages ?? []);
  }

  async function create() {
    const r = await fetch("/api/dashboard/external-training", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, launchUrl, credentialsJson }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error ?? "Failed to create");
    setTitle("");
    setLaunchUrl("");
    setCredentialsJson("{}");
    await reload();
  }

  async function patch(id: string, data: object) {
    await fetch(`/api/dashboard/external-training/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await reload();
  }

  async function remove(id: string) {
    if (window.confirm(t("common.confirmDelete", "Delete this item?"))) {
      await fetch(`/api/dashboard/external-training/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await reload();
    }
  }

  return (
    <div className="mt-6 space-y-5">
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="grid gap-2 rounded border p-4 md:grid-cols-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded border px-3 py-2" />
        <input dir="ltr" value={launchUrl} onChange={(e) => setLaunchUrl(e.target.value)} placeholder="Launch URL" className="rounded border px-3 py-2" />
        <input dir="ltr" value={credentialsJson} onChange={(e) => setCredentialsJson(e.target.value)} placeholder="Credentials JSON" className="rounded border px-3 py-2" />
        <button type="button" onClick={() => void create()} className="rounded bg-[var(--color-primary)] px-4 py-2 text-white">
          Create
        </button>
      </div>
      <div className="space-y-2">
        {pages.map((page) => (
          <div key={page.id} className="flex justify-between rounded border p-4">
            <span>{page.titleAr || page.title}</span>
            <span className="flex gap-3">
              <button type="button" onClick={() => void patch(page.id, { isPublished: !page.isPublished })} className="underline">
                {page.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button type="button" onClick={() => void remove(page.id)} className="text-red-600 underline">
                Delete
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
