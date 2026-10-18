"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiFailure } from "@/lib/vendor/client";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { readGarage, GARAGE_EVENT } from "@/components/fitment/FitmentPicker";
import { ASSISTANT_MAX_CHARS, WEB_STARTERS, type AssistantMessage } from "@/lib/assistant/types";
import type { ShopItem } from "@/lib/catalog/types";
import { whatsapp } from "@/lib/data/site";

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
export function AssistantChat({ initialQuestion }: { initialQuestion?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [car, setCar] = useState<{ slug: string; label: string } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  useEffect(() => {
    setTurns(load());
    const g = () => {
      const garage = readGarage();
      setCar(garage ? { slug: garage.modelSlug, label: garage.label } : null);
    };
    g();
    window.addEventListener(GARAGE_EVENT, g);
    api<{ enabled: boolean }>("/api/assistant").then((r) => setEnabled(r.enabled), () => setEnabled(false));
    return () => window.removeEventListener(GARAGE_EVENT, g);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(turns.slice(-30)));
    } catch {
      /* private mode: the chat just isn't kept */
    }
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns]);

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
    <div className="flex flex-col gap-4">
      <p className="text-xs text-dim">
        {car ? <>Answers are for your <span className="text-chalk">{car.label}</span> (from My Garage). </> : "Tell it your car for parts that fit. "}
        It only knows Riderzpro&apos;s catalogue and can make mistakes; check the product page before you buy.
      </p>

      <div className="space-y-4" aria-live="polite">
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
              {t.items && t.items.length > 0 && (
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

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
        className="sticky bottom-16 flex gap-2 bg-void py-3 md:bottom-0"
      >
        <label htmlFor="assistant-q" className="sr-only">Ask the assistant</label>
        <input
          id="assistant-q"
          className="field min-w-0 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={ASSISTANT_MAX_CHARS}
          placeholder="Ask about parts for your car…"
          autoComplete="off"
          disabled={enabled === null}
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy || !text.trim()}>Ask</button>
      </form>
      {turns.length > 0 && (
        <button type="button" className="self-start text-xs text-ash underline underline-offset-4" onClick={() => setTurns([])}>
          Start a new chat
        </button>
      )}
    </div>
  );
}
