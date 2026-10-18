"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiFailure } from "@/lib/vendor/client";
import { CardImage, CatalogCard } from "@/components/catalog/CatalogCard";
import { useGarage } from "@/lib/client/garage";
import { useHydrated } from "@/lib/client/hooks";
import { ASSISTANT_MAX_CHARS, WEB_STARTERS, type AssistantMessage } from "@/lib/assistant/types";
import type { ShopItem } from "@/lib/catalog/types";
import { whatsapp } from "@/lib/data/site";
import { rupees } from "@/lib/format";

type Turn = AssistantMessage & { items?: ShopItem[] };
const KEY = "riderzpro.assistant.v1";

function load(): Turn[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Turn[]) : [];
    return Array.isArray(v) ? v.slice(-30) : [];
  } catch {
    return [];
  }
}

/**
 * The website's AI shopping assistant. The conversation stays in this tab (sessionStorage) and is
 * sent with each question; the server answers from Riderzpro's own catalogue.
 */
export function AssistantChat({ initialQuestion, compact = false }: { initialQuestion?: string; compact?: boolean }) {
  // The kept conversation lives in this tab's storage, so the chat starts once in the browser.
  const hydrated = useHydrated();
  if (!hydrated) return <p className="p-4 text-sm text-dim">Loading the assistant…</p>;
  return <Chat initialQuestion={initialQuestion} compact={compact} />;
}

/** `compact`: the small pop-up window from the chat button (it scrolls itself; smaller product rows). */
function Chat({ initialQuestion, compact }: { initialQuestion?: string; compact: boolean }) {
  const [turns, setTurns] = useState<Turn[]>(load);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const garage = useGarage();
  const car = garage ? { slug: garage.modelSlug, label: garage.label } : null;
  const end = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const inputId = useId();

  useEffect(() => {
    let live = true;
    api<{ enabled: boolean }>("/api/assistant").then(
      (r) => live && setEnabled(r.enabled),
      () => live && setEnabled(false),
    );
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(turns.slice(-30)));
    } catch {
      /* private mode: the chat just isn't kept */
    }
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns, busy]);

  async function ask(q: string) {
    const question = q.trim().slice(0, ASSISTANT_MAX_CHARS);
    if (!question || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ reply: string; products: ShopItem[] }>("/api/assistant", {
        body: { messages: next.slice(-12).map(({ role, content, products }) => ({ role, content, products })), car: car?.slug },
      });
      setTurns((t) => [...t, { role: "assistant", content: r.reply || "Here's what I found.", products: r.products.map((p) => p.id), items: r.products }]);
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't reach the assistant. Please try again.");
      setTurns((t) => t.slice(0, -1));
      setText(question);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (enabled && initialQuestion && !asked.current) {
      asked.current = true;
      void ask(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the assistant is known to be on
  }, [enabled, initialQuestion]);

  if (enabled === false && compact) {
    return (
      <div className="p-4 text-sm text-ash">
        <p>The AI assistant isn&apos;t switched on yet. Search the shop, or contact us and a person will help.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/shop" className="btn btn-outline btn-sm">Shop accessories</Link>
          <Link href="/contact" className="btn btn-outline btn-sm">Contact us</Link>
        </div>
      </div>
    );
  }

  if (enabled === false) {
    return (
      <div className="card p-6 text-sm text-ash">
        <p>The AI assistant isn&apos;t switched on yet. Search the shop, or ask us on WhatsApp and a person will help.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/shop" className="btn btn-outline btn-sm">Shop accessories</Link>
          <a href={whatsapp("Hi Riderzpro, I need help choosing a part.")} target="_blank" rel="noreferrer noopener" className="btn btn-whatsapp btn-sm">WhatsApp us</a>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "flex h-full min-h-0 flex-col" : "flex flex-col gap-4"}>
      <p className={`text-xs text-dim ${compact ? "border-b border-tint/10 px-4 py-2.5" : ""}`}>
        {car ? <>Answers are for your <span className="text-chalk">{car.label}</span> (from My Garage). </> : "Tell it your car for parts that fit. "}
        It only knows Riderzpro&apos;s catalogue and can make mistakes; check the product page before you buy.
      </p>

      <div className={compact ? "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" : "space-y-4"} aria-live="polite">
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {WEB_STARTERS.map((s) => (
              <button key={s} type="button" className="btn btn-outline btn-sm" onClick={() => ask(s)} disabled={busy || enabled === null}>
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-sm bg-accent px-4 py-2.5 text-sm text-on-accent">{t.content}</div>
          ) : (
            <div key={i} className="space-y-3">
              <div className="card max-w-[92%] whitespace-pre-line px-4 py-3 text-sm text-chalk">{t.content}</div>
              {t.items && t.items.length > 0 && compact && (
                <ul className="space-y-2">
                  {t.items.map((item) => (
                    <li key={item.id}>
                      <MiniItem item={item} />
                    </li>
                  ))}
                </ul>
              )}
              {t.items && t.items.length > 0 && !compact && (
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {t.items.map((item) => (
                    <li key={item.id}>
                      <CatalogCard item={item} sizes="(min-width:768px) 30vw, 46vw" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ),
        )}
        {busy && <p className="text-sm text-dim" role="status">Looking through the catalogue…</p>}
        <div ref={end} />
      </div>

      {error && <p role="alert" className={`text-sm text-danger ${compact ? "px-4 pb-1" : ""}`}>{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
        className={compact ? "flex gap-2 border-t border-tint/10 px-3 py-3" : "sticky bottom-16 flex gap-2 bg-void py-3 md:bottom-0"}
      >
        <label htmlFor={inputId} className="sr-only">Ask the assistant</label>
        <input
          id={inputId}
          data-autofocus={compact || undefined}
          className="field min-w-0 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={ASSISTANT_MAX_CHARS}
          placeholder={compact ? "Ask a question…" : "Ask about parts for your car…"}
          autoComplete="off"
          disabled={enabled === null}
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy || !text.trim()}>Ask</button>
      </form>
      {turns.length > 0 && !compact && (
        <button type="button" className="self-start text-xs text-ash underline underline-offset-4" onClick={() => setTurns([])}>
          Start a new chat
        </button>
      )}
    </div>
  );
}

/** A product row in the small chat window: photo, name, price, opens the product page. */
function MiniItem({ item }: { item: ShopItem }) {
  return (
    <Link href={item.href} className="flex items-center gap-3 rounded-sm border border-tint/10 bg-carbon p-2 transition-colors hover:border-accent">
      <span className={`relative block h-14 w-14 shrink-0 overflow-hidden ${item.image.kind === "remote" && item.image.tone === "light" ? "bg-[#f3f4f5]" : "bg-graphite"}`}>
        <CardImage item={item} sizes="56px" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold leading-snug text-chalk line-clamp-2">{item.title}</span>
        <span className="mt-0.5 block text-xs text-ash tnum">
          {item.buyable && item.price ? rupees(item.price) : "Price on request"}
          {item.seller ? ` · ${item.seller.name}` : ""}
        </span>
      </span>
    </Link>
  );
}
