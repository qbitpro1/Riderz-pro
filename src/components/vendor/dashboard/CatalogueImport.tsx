"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, FileJson, Upload } from "lucide-react";
import { api } from "@/lib/vendor/client";
import { DEPARTMENTS } from "@/lib/data/taxonomy";
import { Pill, ReadOnlyNotice, failureMessage, useFlash } from "./ui";

type Result = {
  index: number;
  sku: string | null;
  title: string | null;
  outcome: "submitted" | "draft" | "failed";
  productId?: string;
  message?: string;
};
type Summary = { submitted: number; draft: number; failed: number };

const MAX_PRODUCTS = 200;
const MAX_BYTES = 2 * 1024 * 1024;

const SAMPLE = `{
  "products": [
    {
      "title": "Apple iPhone 17 (256 GB, Black)",
      "sku": "IP17-256-BLK",
      "price": 79900,
      "mrp": 82900,
      "stock": 10,
      "brand": "Apple",
      "category": "Phone holders",
      "hsn": "8517",
      "gstRate": 18,
      "warrantyMonths": 12,
      "summary": "The latest iPhone, sealed box with Indian warranty.",
      "highlights": ["6.3-inch display", "256 GB storage"],
      "specs": { "Storage": "256 GB", "Colour": "Black" },
      "images": ["https://example.com/photos/iphone-17-black.jpg"]
    },
    {
      "title": "Universal 3D Car Floor Mats",
      "sku": "MAT-3D-UNI",
      "price": 2499,
      "mrp": 3499,
      "stock": 25,
      "department": "interior",
      "group": "floor-mats",
      "fitment": ["universal"],
      "images": ["https://example.com/photos/mats.jpg"]
    }
  ]
}`;

const FIELDS: [string, string][] = [
  ["title, sku, price", "Required. Price and MRP in whole rupees, including GST."],
  ["mrp, stock, lowStockAt", "Optional. MRP defaults to the price, stock to 0."],
  ["brand", "Optional. Defaults to your store name."],
  ["category", 'A category name such as "Seat covers" or "Floor mats". Or give "department" and "group" (see below).'],
  ["hsn, gstRate, warrantyMonths", "Optional. GST rate is one of 0, 5, 12, 18, 28 (default 18)."],
  ["summary, highlights, specs", 'Optional. Specs as [{"label","value"}] or {"Label": "value"}.'],
  ["fitment", 'Vehicle model slugs, or ["universal"] (the default).'],
  ["images", "Up to 8 https photo links (JPG, PNG or WebP, under 5 MB each), or ids of photos you already uploaded."],
];

/** Reads the products array from a parsed file: `{ "products": [...] }` or a bare array. */
function productsOf(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { products?: unknown }).products)) {
    return (data as { products: unknown[] }).products;
  }
  return null;
}

export function CatalogueImport({ readOnly, storeName }: { readOnly: boolean; storeName: string | null }) {
  const [json, setJson] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submit, setSubmit] = useState(true);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { show, node } = useFlash();

  async function pickFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setProblem("That file is over 2 MB. Split it into smaller files.");
      return;
    }
    setFileName(file.name);
    setJson(await file.text());
    setProblem(null);
    setResults(null);
  }

  async function upload() {
    setProblem(null);
    setResults(null);
    let products: unknown[] | null;
    try {
      products = productsOf(JSON.parse(json));
    } catch {
      setProblem("That isn't valid JSON. Check for a missing comma or quote.");
      return;
    }
    if (!products || products.length === 0) {
      setProblem('Put your products in a list: { "products": [ … ] } or [ … ].');
      return;
    }
    if (products.length > MAX_PRODUCTS) {
      setProblem(`At most ${MAX_PRODUCTS} products per upload; this file has ${products.length}. Split it into smaller files.`);
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ results: Result[]; summary: Summary }>("/api/vendor/products/import", {
        method: "POST",
        body: { products, submit },
      });
      setResults(res.results);
      setSummary(res.summary);
      const added = res.summary.submitted + res.summary.draft;
      show(res.summary.failed ? "error" : "ok", `${added} product${added === 1 ? "" : "s"} added${res.summary.failed ? `, ${res.summary.failed} not added` : ""}.`);
    } catch (err) {
      setProblem(failureMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {node}
      <div>
        <Link href="/vendor/dashboard/products" className="inline-flex items-center gap-1.5 text-sm text-ash hover:text-accent">
          <ArrowLeft size={14} aria-hidden /> Products
        </Link>
        <p className="eyebrow mt-3">Catalogue</p>
        <h1 className="display-3 mt-1">Upload products as JSON</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">
          Add many products at once. Every product in the file is listed under your store
          {storeName ? (
            <>
              , <strong className="text-chalk">{storeName}</strong>
            </>
          ) : null}
          , and shows on the website as <strong className="text-chalk">Store: {storeName ?? "your store"}</strong> once it is
          approved.
        </p>
      </div>

      {readOnly && <ReadOnlyNotice />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section className="card space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                void pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn btn-outline" disabled={readOnly || busy} onClick={() => fileInput.current?.click()}>
              <FileJson size={16} aria-hidden /> Choose a .json file
            </button>
            {fileName && <span className="text-sm text-ash">{fileName}</span>}
            <button type="button" className="ml-auto text-xs text-accent underline underline-offset-4" onClick={() => setJson(SAMPLE)}>
              Fill in the example
            </button>
          </div>

          <label className="block">
            <span className="label">Or paste the JSON here</span>
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              spellCheck={false}
              rows={16}
              placeholder={'{ "products": [ { "title": "…", "sku": "…", "price": 999 } ] }'}
              className="input mt-1.5 w-full font-mono text-xs leading-relaxed"
              disabled={readOnly || busy}
            />
          </label>

          <label className="flex items-start gap-2.5 text-sm text-ash">
            <input type="checkbox" className="mt-1" checked={submit} onChange={(e) => setSubmit(e.target.checked)} disabled={readOnly || busy} />
            <span>
              Send complete products for review now. Riderzpro checks them before they appear on the website; incomplete ones
              (no photo, say) are kept as drafts. Untick to save everything as drafts.
            </span>
          </label>

          {problem && (
            <p role="alert" className="rounded-[2px] border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {problem}
            </p>
          )}

          <button type="button" className="btn btn-primary" disabled={readOnly || busy || !json.trim()} onClick={upload}>
            <Upload size={16} aria-hidden /> {busy ? "Uploading… (photos take a moment)" : "Upload products"}
          </button>
        </section>

        <aside className="card space-y-4 p-5 text-sm">
          <p className="font-display text-base font-bold text-chalk">What each product can have</p>
          <dl className="space-y-2.5">
            {FIELDS.map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-xs text-accent">{k}</dt>
                <dd className="text-xs leading-relaxed text-ash">{v}</dd>
              </div>
            ))}
          </dl>
          <details className="text-xs text-ash">
            <summary className="cursor-pointer text-chalk">Departments and groups</summary>
            <ul className="mt-2 space-y-1.5">
              {DEPARTMENTS.map((d) => (
                <li key={d.slug}>
                  <span className="font-mono text-accent">{d.slug}</span>: {d.groups.map((g) => g.slug).join(", ")}
                </li>
              ))}
            </ul>
          </details>
        </aside>
      </div>

      {results && summary && (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-tint/10 p-4 text-sm">
            <p className="font-display text-base font-bold text-chalk">Result</p>
            <Pill tone="ok">{summary.submitted} sent for review</Pill>
            <Pill tone="mute">{summary.draft} saved as drafts</Pill>
            {summary.failed > 0 && <Pill tone="bad">{summary.failed} not added</Pill>}
            <Link href="/vendor/dashboard/products" className="ml-auto text-accent underline underline-offset-4">
              See your products
            </Link>
          </div>
          <ul className="divide-y divide-tint/8">
            {results.map((r) => (
              <li key={r.index} className="flex flex-wrap items-start gap-3 p-4 text-sm">
                <span className="w-8 shrink-0 text-dim tnum">#{r.index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-chalk">
                    {r.title ?? "(no title)"} <span className="font-mono text-xs text-dim">{r.sku ?? ""}</span>
                  </p>
                  {r.message && <p className="mt-1 text-xs text-ash">{r.message}</p>}
                </div>
                {r.outcome === "submitted" && <Pill tone="ok">In review</Pill>}
                {r.outcome === "draft" && <Pill tone="mute">Draft</Pill>}
                {r.outcome === "failed" && <Pill tone="bad">Not added</Pill>}
                {r.productId && (
                  <Link href={`/vendor/dashboard/products/${r.productId}`} className="text-xs text-accent underline underline-offset-4">
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
