"use client";

import { useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { Stars } from "@/components/ui/Section";

export type ModerationItem = {
  id: string;
  name: string;
  city: string | null;
  vehicle: string | null;
  about: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  orderNumber: string | null;
  createdAt: string;
};

/** One review with approve / reject. */
export function ReviewModeration({ item }: { item: ModerationItem }) {
  const [status, setStatus] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decide = async (action: "approve" | "reject") => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/reviews/${item.id}`, { body: { action } });
      setStatus(action === "approve" ? "approved" : "rejected");
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Stars rating={item.rating} />
        <span className="text-xs text-ash">
          {item.about} · order {item.orderNumber ?? "—"} · {new Date(item.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
        </span>
        <span className={`ml-auto text-[10px] font-bold uppercase tracking-[0.1em] ${status === "approved" ? "text-accent" : status === "rejected" ? "text-danger" : "text-gold"}`}>{status}</span>
      </div>
      {item.title && <p className="mt-3 font-semibold text-chalk">{item.title}</p>}
      <p className="mt-2 whitespace-pre-wrap text-sm text-chalk/90">{item.body}</p>
      <p className="mt-3 text-xs text-dim">
        {item.name}{item.city ? ` · ${item.city}` : ""}{item.vehicle ? ` · ${item.vehicle}` : ""}
      </p>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        {status !== "approved" && <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide("approve")}>Approve</button>}
        {status !== "rejected" && <button type="button" className="btn btn-outline btn-sm border-danger/50 text-danger" disabled={busy} onClick={() => decide("reject")}>Reject</button>}
      </div>
    </article>
  );
}
