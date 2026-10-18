"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Send, Sparkles } from "lucide-react";
import { rupees } from "@/lib/format";
import { api, ApiFailure } from "@/lib/vendor/client";
import { ASSISTANT_MAX_CHARS, STORE_STARTERS, type AssistantMessage } from "@/lib/assistant/types";
import { CloseButton, Layer } from "./Layer";
import { VoiceSearch } from "./VoiceSearch";
import { ui, type Car } from "./lib";
import { Photo } from "./parts";
import type { ScreenProduct } from "./types";

export type ScreenOffer = { id: string; percent: number; discount: number; subtotal: number; total: number; expiresAt: number };

type Action =
  | { type: "add"; id: string; qty: number }
  | { type: "offer"; offer: { id: string; percent: number; discount: number; subtotal: number; total: number; validMinutes: number } }
  | { type: "checkout" };

export type AssistantTurn = AssistantMessage;

/**
 * THE AI SALESPERSON on the shop screen. The customer talks or types; it finds products in this
 * shop's stock, shows them, adds them to the order, can agree a special price (within the seller's
 * limits, checked on the server) and opens checkout. The chat lives in the screen and clears with
 * the order.
 */
export function StoreAssistant({
  byId,
  qtys,
  car,
  offer,
  turns,
  setTurns,
  seed,
  onAdd,
  onOffer,
  onCheckout,
  onOpenProduct,
  onClose,
}: {
  byId: Map<string, ScreenProduct>;
  qtys: Record<string, number>;
  car: Car | null;
  offer: ScreenOffer | null;
  turns: AssistantTurn[];
  setTurns: (fn: (t: AssistantTurn[]) => AssistantTurn[]) => void;
  seed: string | null;
  onAdd: (id: string, qty: number) => void;
  onOffer: (o: ScreenOffer) => void;
  onCheckout: () => void;
  onOpenProduct: (id: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  // Voice fills the box as the customer speaks; the question goes when they stop.
  const spoken = useRef("");

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns, busy]);

  async function ask(q: string) {
    const question = q.trim().slice(0, ASSISTANT_MAX_CHARS);
    if (!question || busy) return;
    const next = [...turnsRef.current, { role: "user" as const, content: question }];
    setTurns(() => next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ reply: string; products: string[]; actions: Action[] }>("/api/vendor/store-screen/assistant", {
        body: {
          messages: next.slice(-12),
          cart: Object.entries(qtys).map(([id, qty]) => ({ id, qty })),
          car: car?.slug,
          offerId: offer && offer.expiresAt > Date.now() ? offer.id : null,
        },
      });
      setTurns((t) => [...t, { role: "assistant", content: r.reply || "Here you go.", products: r.products }]);
      let checkout = false;
      for (const a of r.actions) {
        if (a.type === "add") onAdd(a.id, a.qty);
        if (a.type === "offer") onOffer({ ...a.offer, expiresAt: Date.now() + a.offer.validMinutes * 60_000 });
        if (a.type === "checkout") checkout = true;
      }
      if (checkout) onCheckout();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "The assistant didn't answer. Please try again or ask the staff.");
      setTurns((t) => t.slice(0, -1));
      setText(question);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (seed && !seeded.current) {
      seeded.current = true;
      void ask(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the first question, once
  }, [seed]);

  return (
    <Layer label="Ask our AI assistant" onClose={onClose} kind="drawer" size="lg">
      <div className="flex items-center justify-between gap-3 border-b border-tint/10 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-on-accent">
            <Sparkles size={22} aria-hidden />
          </span>
          <div>
            <p className="font-display text-xl font-extrabold text-chalk">Ask our assistant</p>
            <p className="text-sm text-dim">Finds parts, compares, adds to your order</p>
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="ss-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6" aria-live="polite">
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-base text-ash">Tell me your car and what you&apos;re looking for. You can talk: tap the mic.</p>
            <div className="flex flex-wrap gap-2">
              {STORE_STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)} disabled={busy} className={`${ui.pill} border-tint/15 text-ash`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) =>
          t.role === "user" ? (
            <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-3 text-base text-on-accent">{t.content}</p>
          ) : (
            <div key={i} className="space-y-3">
              <p className="w-fit max-w-[92%] whitespace-pre-line rounded-2xl rounded-bl-md bg-carbon px-4 py-3 text-base text-chalk">{t.content}</p>
              {t.products && t.products.length > 0 && (
                <ul className="grid grid-cols-2 gap-3">
                  {t.products.map((id) => {
                    const p = byId.get(id);
                    if (!p) return null;
                    const inOrder = qtys[id] ?? 0;
                    return (
                      <li key={id} className="overflow-hidden rounded-2xl border border-tint/10 bg-void">
                        <button type="button" onClick={() => onOpenProduct(id)} className="block w-full text-left">
                          <Photo id={p.images[0]} alt={p.title} sizes="220px" className="aspect-square" />
                          <span className="block px-3 pt-2 text-sm font-semibold leading-snug text-chalk line-clamp-2">{p.title}</span>
                          <span className="block px-3 pb-1 tnum text-base font-bold text-chalk">
                            {rupees(p.price)}
                            {p.mrp > p.price && <span className="ml-1.5 text-sm font-normal text-dim line-through">{rupees(p.mrp)}</span>}
                          </span>
                        </button>
                        <div className="px-3 pb-3">
                          <button type="button" onClick={() => onAdd(id, 1)} disabled={inOrder >= p.stock} className={`${ui.secondary} min-h-11 w-full px-3 text-sm`}>
                            <Plus size={16} aria-hidden /> {inOrder ? `Add another (${inOrder})` : "Add to order"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ),
        )}
        {busy && (
          <p className="text-base text-dim" role="status">
            Checking our stock…
          </p>
        )}
        <div ref={end} />
      </div>

      {offer && offer.expiresAt > Date.now() && (
        <div className="mx-5 mb-3 rounded-2xl border border-accent bg-accent/10 px-4 py-3 text-base md:mx-6">
          <span className="font-bold text-chalk">Special price agreed: {offer.percent}% off</span>
          <span className="text-ash"> · you save {rupees(offer.discount)} · ready at checkout</span>
        </div>
      )}
      {error && <p role="alert" className="px-5 pb-2 text-sm text-danger md:px-6">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
        className="flex items-center gap-2 border-t border-tint/10 bg-carbon px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-6"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Your question</span>
          <input
            data-autofocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={ASSISTANT_MAX_CHARS}
            placeholder="Ask anything, or tap the mic…"
            autoComplete="off"
            enterKeyHint="send"
            className="h-14 w-full rounded-xl border border-tint/15 bg-void pl-4 pr-14 text-base text-chalk outline-none placeholder:text-dim focus:border-accent"
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2">
            <VoiceSearch
              onText={(t) => {
                spoken.current = t;
                setText(t);
              }}
              onListening={(on) => {
                // Called on every render too (VoiceSearch's effect), so take the words only once.
                if (on) spoken.current = "";
                else if (spoken.current) {
                  const q = spoken.current;
                  spoken.current = "";
                  void ask(q);
                }
              }}
            />
          </span>
        </label>
        <button type="submit" disabled={busy || !text.trim()} className={`${ui.primary} h-14 px-5`} aria-label="Send">
          <Send size={20} aria-hidden />
        </button>
      </form>
    </Layer>
  );
}
