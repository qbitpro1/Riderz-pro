"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { rupees } from "@/lib/format";
import { CloseButton, Layer } from "./Layer";
import { LOW_STOCK, maxFor, offPct, ui } from "./lib";
import { Photo, Price, Stepper } from "./parts";
import type { ScreenProduct } from "./types";

type Row = { label: string; values: string[]; lists?: string[][] };

const NONE = "—";

function fitsText(p: ScreenProduct): string {
  if (p.universal && p.fitLabels.length === 0) return "Universal";
  const list = p.fitLabels.slice(0, 4).join(", ") + (p.fitLabels.length > 4 ? ` +${p.fitLabels.length - 4} more` : "");
  return p.universal ? `Universal, plus ${list}` : list || "Not stated";
}

/**
 * Side-by-side comparison of up to three products: photo, price, saving, what it fits, part type,
 * warranty, stock and every specification any of them lists. "Differences only" hides the shared rows.
 */
export function CompareSheet({
  products,
  qtys,
  onSetQty,
  onRemove,
  onOpen,
  onClose,
}: {
  products: ScreenProduct[];
  qtys: Record<string, number>;
  onSetQty: (id: string, n: number) => void;
  onRemove: (id: string) => void;
  onOpen: (p: ScreenProduct) => void;
  onClose: () => void;
}) {
  const [diffOnly, setDiffOnly] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const base: Row[] = [
      { label: "Price", values: products.map((p) => rupees(p.price)) },
      { label: "MRP", values: products.map((p) => rupees(p.mrp)) },
      { label: "You save", values: products.map((p) => (p.mrp > p.price ? `${rupees(p.mrp - p.price)} (${offPct(p)}% off)` : "No discount")) },
      { label: "Brand", values: products.map((p) => p.brand || NONE) },
      { label: "Category", values: products.map((p) => p.groupName || p.department || NONE) },
      { label: "Part type", values: products.map((p) => p.partType || NONE) },
      { label: "Warranty", values: products.map((p) => (p.warrantyMonths ? `${p.warrantyMonths} months` : "Not stated")) },
      { label: "Fits", values: products.map(fitsText) },
      { label: "Stock", values: products.map((p) => (p.stock <= 0 ? "Out of stock" : p.stock <= LOW_STOCK ? `Only ${p.stock} left` : "In stock")) },
    ];
    const labels: string[] = [];
    for (const p of products) for (const s of p.specs) if (!labels.includes(s.label)) labels.push(s.label);
    const specs = labels.map((label) => ({
      label,
      values: products.map((p) => p.specs.find((s) => s.label === label)?.value ?? NONE),
    }));
    const highlights: Row = {
      label: "Highlights",
      values: products.map((p) => p.highlights.join("\n")),
      lists: products.map((p) => p.highlights),
    };
    const all = [...base, ...specs, highlights];
    return diffOnly ? all.filter((r) => new Set(r.values).size > 1) : all;
  }, [products, diffOnly]);

  return (
    <Layer label="Compare products" onClose={onClose} kind="full">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-tint/10 px-4 py-3 md:px-8">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-chalk md:text-3xl">Compare</h2>
          <p className="text-sm text-dim md:text-base">{products.length} of 3 products</p>
        </div>
        <div className="flex items-center gap-3">
          {products.length > 1 && (
            <button
              type="button"
              aria-pressed={diffOnly}
              onClick={() => setDiffOnly((v) => !v)}
              className={`${ui.pill} ${diffOnly ? "border-chalk bg-chalk text-void" : "border-tint/20 text-chalk"}`}
            >
              Differences only
            </button>
          )}
          <CloseButton onClick={onClose} label="Close compare" />
        </div>
      </div>

      <div className="ss-scroll min-h-0 flex-1 overflow-auto">
        {products.length < 2 ? (
          <div className="mx-auto max-w-md px-6 py-16 text-center">
            <p className="font-display text-2xl font-extrabold tracking-tight text-chalk">Pick one more to compare</p>
            <p className="mt-2 text-base text-ash">Tap the compare button on another product, then come back here.</p>
            <button type="button" data-autofocus onClick={onClose} className={`${ui.primary} mt-6`}>
              Keep browsing
            </button>
          </div>
        ) : (
          <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0">
            <caption className="sr-only">Side by side comparison of {products.length} products</caption>
            <colgroup>
              <col className="w-32 md:w-48" />
              {products.map((p) => (
                <col key={p.id} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 top-0 z-20 border-b border-tint/10 bg-void px-3 text-left align-bottom text-sm font-semibold text-dim md:px-5 md:text-base">
                  <span className="sr-only">Detail</span>
                </th>
                {products.map((p) => {
                  const qty = qtys[p.id] ?? 0;
                  const max = maxFor(p);
                  return (
                    <th key={p.id} scope="col" className="sticky top-0 z-10 border-b border-l border-tint/10 bg-void p-3 text-left align-top font-normal md:p-4">
                      <div className="relative">
                        <button type="button" onClick={() => onOpen(p)} className="block w-full text-left" aria-label={`${p.title}. View details`}>
                          <Photo id={p.images[0]} alt="" sizes="(min-width:1024px) 20vw, 40vw" className="h-36 w-full rounded-xl md:h-44" pad="p-2" />
                          {p.brand && <p className="mt-2 truncate text-sm font-semibold uppercase tracking-wide text-dim">{p.brand}</p>}
                          <p className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-chalk md:text-lg">{p.title}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(p.id)}
                          aria-label={`Remove ${p.title} from compare`}
                          className="absolute right-1 top-1 grid h-12 w-12 place-items-center rounded-full bg-void text-ash shadow-md active:scale-90"
                        >
                          <X size={20} aria-hidden />
                        </button>
                      </div>
                      <Price p={p} className="mt-1.5" />
                      {qty > 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <Stepper value={qty} max={max} onChange={(n) => onSetQty(p.id, Math.max(0, Math.min(n, max)))} label={p.title} compact />
                          <span className="text-sm text-dim">in order</span>
                        </div>
                      ) : (
                        <button type="button" onClick={() => onSetQty(p.id, 1)} disabled={max < 1} className={`${ui.primary} mt-2 min-h-12 w-full`}>
                          <Plus size={18} aria-hidden /> Add to order
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={i % 2 === 0 ? "bg-carbon" : ""}>
                  <th scope="row" className={`sticky left-0 z-[5] px-3 py-3.5 text-left align-top text-base font-semibold text-dim md:px-5 md:text-lg ${i % 2 === 0 ? "bg-carbon" : "bg-void"}`}>
                    {r.label}
                  </th>
                  {r.values.map((v, j) => (
                    <td key={j} className="break-words border-l border-tint/10 px-3 py-3.5 align-top text-base text-chalk md:px-5 md:text-lg">
                      {r.lists ? (
                        r.lists[j].length > 0 ? (
                          <ul className="list-disc space-y-1 pl-5">
                            {r.lists[j].map((h, k) => (
                              <li key={k}>{h}</li>
                            ))}
                          </ul>
                        ) : (
                          NONE
                        )
                      ) : (
                        v
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={products.length + 1} className="px-5 py-10 text-center text-base text-ash">
                    These products match on every detail shown.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layer>
  );
}
