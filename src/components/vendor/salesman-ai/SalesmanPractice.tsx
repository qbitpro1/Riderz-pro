"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { rupees } from "@/lib/format";
import { api, ApiFailure } from "@/lib/vendor/client";
import { ASSISTANT_MAX_CHARS, STORE_STARTERS, type AssistantMessage } from "@/lib/assistant/types";
import { Photo } from "@/components/vendor/store-screen/parts";
import type { ScreenProduct } from "@/components/vendor/store-screen/types";

type Action =
  | { type: "add"; id: string; qty: number }
  | { type: "offer"; offer: { id: string; percent: number; discount: number; subtotal: number; total: number; validMinutes: number } }
  | { type: "checkout" };

type Status = { full: boolean; on: boolean; bargain: { pct: number; rupees: number | null } | null };

/**
 * SALESMAN AI in the seller dashboard: what it does, whether it is on, and a practice chat where the
 * seller plays the customer. It is the same salesman as the shop screen (same server, same stock,
 * same limits), but the order here is only for practice: nothing is sold or reserved.
 */
export function SalesmanPractice({ storeName, products, status }: { storeName: string; products: ScreenProduct[]; status: Status }) {
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [turns, setTurns] = useState<AssistantMessage[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [offer, setOffer] = useState<{ id: string; percent: number; discount: number; total: number } | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const ready = status.on && products.length > 0;
  const lines = Object.entries(cart).flatMap(([id, qty]) => {
    const p = byId.get(id);
    return p ? [{ p, qty }] : [];
  });
  const subtotal = lines.reduce((n, l) => n + l.p.price * l.qty, 0);

  async function ask(q: string) {
    const question = q.trim().slice(0, ASSISTANT_MAX_CHARS);
    if (!question || busy || !ready) return;
    const next = [...turns, { role: "user" as const, content: question }];
    setTurns(next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ reply: string; products: string[]; actions: Action[] }>("/api/vendor/store-screen/assistant", {
        body: { messages: next.slice(-12), cart: Object.entries(cart).map(([id, qty]) => ({ id, qty })), offerId: offer?.id ?? null },
      });
      setTurns((t) => [...t, { role: "assistant", content: r.reply || "Here you go.", products: r.products }]);
      for (const a of r.actions) {
        if (a.type === "add") setCart((c) => ({ ...c, [a.id]: (c[a.id] ?? 0) + a.qty }));
        if (a.type === "offer") setOffer(a.offer);
        if (a.type === "checkout") setCheckout(true);
      }
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Salesman AI didn't answer. Please try again.");
      setTurns((t) => t.slice(0, -1));
      setText(question);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTurns([]);
    setCart({});
    setOffer(null);
    setCheckout(false);
    setError(null);
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <StatusCard title="Status" ok={status.on}>
          {status.on ? "On: customers see “Ask Salesman AI” on your shop screen." : "Off on your shop screen."}
          {` Mode: ${status.full ? "Full AI" : "Basic (free: finds, compares, adds products and bargains)"}.`}
        </StatusCard>
        <StatusCard title="Bargaining" ok={Boolean(status.bargain)}>
          {status.bargain
            ? `On: 5%, then 7%, then 8% as its last price; 10% only if pushed. Never above ${status.bargain.pct}%${status.bargain.rupees ? ` or ${rupees(status.bargain.rupees)}` : ""}.`
            : "Off: it tells customers your prices are final."}
        </StatusCard>
        <StatusCard title="Your stock" ok={products.length > 0}>
          {products.length > 0 ? `It knows your ${products.length} live, in-stock product${products.length === 1 ? "" : "s"}.` : "No live products in stock yet, so it has nothing to sell."}
        </StatusCard>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/vendor/dashboard/store-screen" className="btn btn-outline btn-sm">Salesman AI and bargaining settings</Link>
        <Link href="/vendor/dashboard/products" className="btn btn-outline btn-sm">Your products</Link>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-tint/10 px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-chalk">Practice with your salesman</h2>
            <p className="text-xs text-dim">You play the customer. Practice only: nothing is sold or reserved.</p>
          </div>
          {turns.length > 0 && (
            <button type="button" className="text-xs text-ash underline underline-offset-4" onClick={reset}>
              Start again
            </button>
          )}
        </div>

        {!ready ? (
          <p className="px-4 py-6 text-sm text-ash">
            {!status.on
                ? "Turn on Salesman AI in the Offline Store settings to practise here."
                : "Add live products with stock first; the salesman only sells what you have."}
          </p>
        ) : (
          <div className="grid md:grid-cols-[1fr_260px]">
            <div className="flex min-h-[420px] flex-col">
              <div ref={box} className="max-h-[520px] min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                {turns.length === 0 && (
                  <p className="w-fit max-w-[92%] rounded-sm bg-carbon px-3.5 py-2 text-sm text-chalk">{`Namaste! Welcome to ${storeName}. Kaunsi gaadi hai aapki, aur kya dhoondh rahe hain?`}</p>
                )}
                {turns.length === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {STORE_STARTERS.map((s) => (
                      <button key={s} type="button" className="btn btn-outline btn-sm" onClick={() => ask(s)} disabled={busy}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {turns.map((t, i) =>
                  t.role === "user" ? (
                    <p key={i} className="ml-auto w-fit max-w-[85%] rounded-sm bg-accent px-3.5 py-2 text-sm text-on-accent">{t.content}</p>
                  ) : (
                    <div key={i} className="space-y-2">
                      <p className="w-fit max-w-[92%] whitespace-pre-line rounded-sm bg-carbon px-3.5 py-2 text-sm text-chalk">{t.content}</p>
                      {t.products && t.products.length > 0 && (
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {t.products.map((id) => {
                            const p = byId.get(id);
                            if (!p) return null;
                            return (
                              <li key={id} className="overflow-hidden rounded-sm border border-tint/10">
                                <Photo id={p.images[0]} alt={p.title} sizes="160px" className="aspect-square" />
                                <span className="block px-2 pt-1.5 text-xs font-semibold leading-snug text-chalk line-clamp-2">{p.title}</span>
                                <span className="block px-2 pb-2 text-xs text-ash tnum">{rupees(p.price)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ),
                )}
                {busy && <p className="text-sm text-dim" role="status">Checking your stock…</p>}
              </div>
              {error && <p role="alert" className="px-4 pb-2 text-sm text-danger">{error}</p>}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask(text);
                }}
                className="flex gap-2 border-t border-tint/10 px-3 py-3"
              >
                <label htmlFor="salesman-q" className="sr-only">Your message as the customer</label>
                <input
                  id="salesman-q"
                  className="field min-w-0 flex-1"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={ASSISTANT_MAX_CHARS}
                  placeholder="Talk like a customer: “seat covers for my Creta, thoda kam karo?”"
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary shrink-0" disabled={busy || !text.trim()}>Send</button>
              </form>
            </div>

            <aside className="border-t border-tint/10 p-4 text-sm md:border-l md:border-t-0">
              <h3 className="eyebrow mb-2">Practice order</h3>
              {lines.length === 0 ? (
                <p className="text-xs text-dim">Empty. The salesman adds products when the “customer” agrees.</p>
              ) : (
                <ul className="space-y-1.5">
                  {lines.map(({ p, qty }) => (
                    <li key={p.id} className="flex justify-between gap-2 text-xs">
                      <span className="text-chalk line-clamp-2">{qty} × {p.title}</span>
                      <span className="shrink-0 text-ash tnum">{rupees(p.price * qty)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between border-t border-tint/10 pt-1.5 text-xs font-semibold text-chalk">
                    <span>Subtotal</span>
                    <span className="tnum">{rupees(subtotal)}</span>
                  </li>
                </ul>
              )}
              {offer && (
                <p className="mt-3 rounded-sm border border-accent bg-accent/10 px-3 py-2 text-xs text-chalk">
                  Special price agreed: {offer.percent}% off, saves {rupees(offer.discount)}.
                </p>
              )}
              {checkout && <p className="mt-3 text-xs text-accent">On the shop screen, checkout would open now.</p>}
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusCard({ title, ok, children }: { title: string; ok: boolean; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="eyebrow mb-1.5 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${ok ? "bg-accent" : "bg-dim"}`} aria-hidden />
        {title}
      </p>
      <p className="text-xs text-ash">{children}</p>
    </div>
  );
}
