"use client";

import { useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";

export type ReviewTargetView = { productSlug: string | null; title: string; reviewed: boolean; status: string | null };

const STATUS_TEXT: Record<string, string> = {
  pending: "Thanks — your review is waiting for our team to check it.",
  approved: "Your review is live.",
  rejected: "Your review wasn't published.",
};

/** Review what you received (order page). One review per product per order; shown after an admin approves it. */
export function ReviewForm({ orderNumber, targets, defaultName, defaultVehicle }: { orderNumber: string; targets: ReviewTargetView[]; defaultName: string; defaultVehicle: string }) {
  const [list, setList] = useState(targets);
  const open = list.filter((t) => !t.reviewed);
  const [target, setTarget] = useState<string>(open[0] ? open[0].productSlug ?? "" : "");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(defaultName);
  const [city, setCity] = useState("");
  const [vehicle, setVehicle] = useState(defaultVehicle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const productSlug = target === "" ? null : target;
      await api("/api/account/reviews", { body: { orderNumber, productSlug, rating, title, body, name, city, vehicle } });
      const next = list.map((t) => (t.productSlug === productSlug ? { ...t, reviewed: true, status: "pending" } : t));
      setList(next);
      const left = next.filter((t) => !t.reviewed);
      setTarget(left[0] ? left[0].productSlug ?? "" : "");
      setRating(0);
      setTitle("");
      setBody("");
    } catch (e) {
      setError(e instanceof ApiFailure ? Object.values(e.fields)[0] ?? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="review-title">
      <h2 id="review-title" className="text-xs font-bold uppercase tracking-[0.12em] text-dim">Review your order</h2>
      {list.some((t) => t.reviewed) && (
        <ul className="mt-3 space-y-1 text-xs text-ash">
          {list.filter((t) => t.reviewed).map((t) => (
            <li key={t.productSlug ?? "order"}><span className="font-semibold text-chalk">{t.title}:</span> {STATUS_TEXT[t.status ?? "pending"]}</li>
          ))}
        </ul>
      )}
      {open.length === 0 ? null : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="rv-target">What are you reviewing?</label>
            <select id="rv-target" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
              {open.map((t) => <option key={t.productSlug ?? "order"} value={t.productSlug ?? ""}>{t.title}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="label">Your rating</legend>
            <div className="flex gap-1" role="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className={`h-10 w-10 rounded-sm border text-lg ${n <= rating ? "border-gold bg-gold/15 text-gold" : "border-tint/15 text-dim"}`}
                  onClick={() => setRating(n)}>★</button>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="rv-title">Headline (optional)</label>
            <input id="rv-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="rv-body">Your review</label>
            <textarea id="rv-body" className="field min-h-24 py-2" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} placeholder="How was the product, the fitting and the delivery?" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="rv-name">Name shown</label>
              <input id="rv-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>
            <div>
              <label className="label" htmlFor="rv-city">City (optional)</label>
              <input id="rv-city" className="field" value={city} onChange={(e) => setCity(e.target.value)} maxLength={40} />
            </div>
            <div>
              <label className="label" htmlFor="rv-vehicle">Car (optional)</label>
              <input id="rv-vehicle" className="field" value={vehicle} onChange={(e) => setVehicle(e.target.value)} maxLength={60} />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || rating === 0 || body.trim().length < 10 || name.trim().length < 2} onClick={send}>
            {busy ? "Sending…" : "Send review"}
          </button>
          <p className="text-xs text-dim">Our team checks every review before it appears on the site.</p>
        </div>
      )}
    </section>
  );
}
