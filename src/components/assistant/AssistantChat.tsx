"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiFailure } from "@/lib/vendor/client";
import { CardImage, CatalogCard } from "@/components/catalog/CatalogCard";
import { useGarage } from "@/lib/client/garage";
import { useHydrated } from "@/lib/client/hooks";
import { ASSISTANT_MAX_CHARS, WEB_STARTERS, type AssistantMessage } from "@/lib/assistant/types";
import type { ShopItem } from "@/lib/catalog/types";
import { rupees } from "@/lib/format";
import { EnquiryButton } from "@/components/enquiry/Enquiry";
import { Icon } from "@/components/ui/Icon";

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
        <p>The AI assistant isn&apos;t switched on yet. Search the shop, or send us a message and a person will help.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/shop" className="btn btn-outline btn-sm">Shop accessories</Link>
          <EnquiryButton topic="product" message={"Hi Riderzpro, I need help choosing a part."} className="btn btn-primary btn-sm">Message us</EnquiryButton>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "flex h-full min-h-0 flex-col text-cl-ink" : "flex flex-col gap-4 text-cl-ink"}>
      <p className={`flex items-start gap-2 rounded-2xl bg-cl-ink/[0.04] px-3 py-2.5 text-[12px] leading-relaxed text-cl-muted ${compact ? "mx-3 mt-3" : ""}`}>
        <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
        <span>
          {car ? <>Answers are for your <span className="font-semibold text-cl-ink">{car.label}</span> (from My Garage). </> : "Tell it your car for parts that fit. "}
          It only knows Riderzpro&apos;s catalogue and can make mistakes; check the product page before you buy.
        </span>
      </p>

      <div className={compact ? "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4" : "space-y-4"} aria-live="polite">
        {turns.length === 0 && (
          <div className={compact ? "px-1" : ""}>
            <p className="text-[17px] font-semibold tracking-[-0.02em]">What can I help you find?</p>
            <p className="mt-0.5 text-[13px] text-cl-muted">Try one of these, or ask in your own words.</p>
            <ul className="mt-3 flex flex-col items-start gap-2">
              {WEB_STARTERS.map((s) => (
                <li key={s} className="max-w-full">
                  <button
                    type="button"
                    className="fs-well group inline-flex min-h-11 max-w-full items-center gap-2 rounded-full py-2 pl-4 pr-3 text-left text-[14px] text-cl-ink transition-[background-color,scale] duration-150 hover:bg-cl-ink/[0.06] active:scale-[0.98] disabled:opacity-50"
                    onClick={() => ask(s)}
                    disabled={busy || enabled === null}
                  >
                    <span className="min-w-0">{s}</span>
                    <Icon name="arrow" size={13} className="shrink-0 text-cl-muted transition-transform duration-150 group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="ml-auto w-fit max-w-[85%] rounded-[20px] rounded-br-md bg-cl-ink px-4 py-2.5 text-[14px] leading-relaxed text-cl-on-ink">
              {t.content}
            </div>
          ) : (
            <div key={i} className="space-y-2.5">
              <div className="flex items-end gap-2">
                <span className="fs-icon mb-0.5 h-7 w-7 rounded-full" aria-hidden="true">
                  <Icon name="spark" size={12} />
                </span>
                <div className="fs-well max-w-[88%] whitespace-pre-line rounded-[20px] rounded-bl-md px-4 py-3 text-[14px] leading-relaxed text-cl-ink">
                  {t.content}
                </div>
              </div>
              {t.items && t.items.length > 0 && compact && (
                <ul className="space-y-2 pl-9">
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
        {busy && (
          <div className="flex items-end gap-2" role="status">
            <span className="fs-icon mb-0.5 h-7 w-7 rounded-full" aria-hidden="true">
              <Icon name="spark" size={12} />
            </span>
            <div className="fs-well rounded-[20px] rounded-bl-md px-4 py-3.5">
              <span className="fs-typing flex items-center gap-1" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="sr-only">Looking through the catalogue…</span>
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      {error && <p role="alert" className={`text-[13px] text-danger ${compact ? "px-4 pb-1" : ""}`}>{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
        className={
          compact
            ? "flex items-center gap-2 border-t border-cl-ink/[0.07] p-3"
            : "sticky bottom-16 flex items-center gap-2 bg-void/85 py-3 backdrop-blur md:bottom-0"
        }
      >
        <label htmlFor={inputId} className="sr-only">Ask the assistant</label>
        <input
          id={inputId}
          data-autofocus={compact || undefined}
          className="fs-well fs-field min-h-12 min-w-0 flex-1 rounded-full px-4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={ASSISTANT_MAX_CHARS}
          placeholder={compact ? "Ask a question…" : "Ask about parts for your car…"}
          autoComplete="off"
          disabled={enabled === null}
        />
        <button type="submit" className="fs-btn h-12 w-12 shrink-0 px-0" disabled={busy || !text.trim()} aria-label="Ask">
          <Icon name="arrow" size={17} className="-rotate-90" />
        </button>
      </form>
      {turns.length > 0 && !compact && (
        <button type="button" className="self-start text-xs text-cl-muted underline underline-offset-4 hover:text-cl-ink" onClick={() => setTurns([])}>
          Start a new chat
        </button>
      )}
    </div>
  );
}

/** A product row in the small chat window: photo, name, price, opens the product page. */
function MiniItem({ item }: { item: ShopItem }) {
  return (
    <Link href={item.href} className="fs-well group flex items-center gap-3 rounded-2xl p-2 pr-3 transition-colors hover:bg-cl-ink/[0.06]">
      <span className={`relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl ${item.image.kind === "remote" && item.image.tone === "light" ? "bg-[#f3f4f5]" : "bg-graphite"}`}>
        <CardImage item={item} sizes="56px" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-snug text-cl-ink line-clamp-2">{item.title}</span>
        <span className="mt-0.5 block text-[12px] text-cl-muted tnum">
          {item.buyable && item.price ? rupees(item.price) : "Price on request"}
          {item.seller ? ` · ${item.seller.name}` : ""}
        </span>
      </span>
      <Icon name="arrow" size={13} className="shrink-0 text-cl-muted transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}
