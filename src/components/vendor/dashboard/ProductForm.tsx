"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { DEPARTMENTS, type DepartmentSlug } from "@/lib/data/taxonomy";
import { rupees } from "@/lib/format";
import {
  DEFAULT_COMMISSION_RATE,
  GST_RATES,
  PART_TYPES,
  PART_TYPE_LABELS,
  settlementFor,
  type PartType,
  type VendorProduct,
  type VendorProductContent,
} from "@/lib/vendor/types";
import { productCommercialSchema, productContentSchema, productDraftSchema } from "@/lib/vendor/validators";
import { FitmentPicker } from "./FitmentPicker";
import { ProductImages } from "./ProductImages";
import { ReadOnlyNotice, StatusBadge, failureMessage, fieldErrors, toInt, useFlash } from "./ui";

type FormState = {
  title: string;
  brand: string;
  department: DepartmentSlug;
  groupSlug: string;
  partType: PartType;
  hsn: string;
  gstRate: string;
  warranty: string;
  summary: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  fitment: string[];
  images: string[];
  sku: string;
  mrp: string;
  price: string;
  stock: string;
  lowStockAt: string;
};

type Props = {
  product: VendorProduct | null;
  commissionRate: number | null;
  readOnly: boolean;
  /** One-off message shown on arrival (e.g. after creating a draft). */
  notice?: string;
};

const base = "/vendor/dashboard/products";
/** Focus order for "first error". */
const FIELD_ORDER = ["title", "brand", "department", "groupSlug", "partType", "summary", "highlights", "specs", "fitment", "warrantyMonths", "hsn", "gstRate", "sku", "mrp", "price", "stock", "lowStockAt", "images"];

function initialState(product: VendorProduct | null): FormState {
  const c: VendorProductContent | null = product ? (product.status === "live" && product.pendingRevision) || product : null;
  return {
    title: c?.title ?? "",
    brand: c?.brand ?? "",
    department: c?.department ?? DEPARTMENTS[0].slug,
    groupSlug: c?.groupSlug ?? "",
    partType: c?.partType ?? "aftermarket",
    hsn: c?.hsn ?? "",
    gstRate: String(c?.gstRate ?? 18),
    warranty: c?.warrantyMonths == null ? "" : String(c.warrantyMonths),
    summary: c?.summary ?? "",
    highlights: c?.highlights?.length ? [...c.highlights] : [],
    specs: c?.specs?.length ? c.specs.map((s) => ({ ...s })) : [],
    fitment: c?.fitment ? [...c.fitment] : [],
    images: c?.images ? [...c.images] : [],
    sku: product?.sku ?? "",
    mrp: product ? String(product.mrp) : "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "0",
    lowStockAt: product ? String(product.lowStockAt) : "3",
  };
}

function Err({ name, error }: { name: string; error?: string }) {
  return error ? (
    <p id={`e-${name}`} className="mt-1.5 text-sm text-danger">
      {error}
    </p>
  ) : null;
}

function Field({ name, label, hint, error, children, className }: { name: string; label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-dim">{hint}</p>}
      <Err name={name} error={error} />
    </div>
  );
}

export function ProductForm({ product: initialProduct, commissionRate, readOnly, notice }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [f, setF] = useState<FormState>(() => initialState(initialProduct));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { show, node } = useFlash();

  useEffect(() => {
    if (notice) show("ok", notice);
  }, [notice, show]);

  const status = product?.status ?? "draft";
  const isNew = !product;
  const isLive = status === "live";
  const editable = status === "draft" || status === "changes_requested" || status === "rejected";
  const contentLocked = readOnly || status === "pending_review" || status === "archived";
  const commercialLocked = readOnly || status === "archived";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setF((s) => ({ ...s, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const groups = useMemo(() => DEPARTMENTS.find((d) => d.slug === f.department)?.groups ?? [], [f.department]);

  /* ---- build payloads ---- */
  function buildContent() {
    return {
      title: f.title.trim(),
      brand: f.brand.trim(),
      department: f.department,
      groupSlug: f.groupSlug,
      partType: f.partType,
      hsn: f.hsn.trim() || null,
      gstRate: Number(f.gstRate),
      warrantyMonths: f.warranty.trim() === "" ? null : toInt(f.warranty),
      summary: f.summary.trim() || null,
      highlights: f.highlights.map((h) => h.trim()).filter(Boolean),
      specs: f.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() })).filter((s) => s.label || s.value),
      fitment: f.fitment,
      images: f.images,
    };
  }

  function buildCommercial(): { value: { sku: string; mrp: number; price: number; stock: number; lowStockAt: number } | null; errs: Record<string, string> } {
    const errs: Record<string, string> = {};
    const num = (key: "mrp" | "price" | "stock" | "lowStockAt", raw: string) => {
      const n = toInt(raw);
      if (n === null) errs[key] = "Enter a whole number";
      return n;
    };
    const mrp = num("mrp", f.mrp);
    const price = num("price", f.price);
    const stock = num("stock", f.stock);
    const lowStockAt = num("lowStockAt", f.lowStockAt);
    if (mrp === null || price === null || stock === null || lowStockAt === null) return { value: null, errs };
    const parsed = productCommercialSchema.safeParse({ sku: f.sku, mrp, price, stock, lowStockAt });
    if (!parsed.success) {
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      return { value: null, errs };
    }
    return { value: parsed.data, errs };
  }

  function fail(errs: Record<string, string>) {
    setErrors(errs);
    const first = FIELD_ORDER.find((k) => errs[k]) ?? Object.keys(errs).find((k) => errs[k]);
    if (first) {
      const el = document.getElementById(`f-${first}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
    }
    show("error", "Some details need fixing. Check the highlighted fields.");
  }

  type Mode = "draft" | "submit" | "commercial" | "revision";

  async function save(mode: Mode) {
    setErrors({});
    const { value: commercial, errs } = buildCommercial();
    const content = buildContent();
    const allErrs: Record<string, string> = { ...errs };

    if (mode !== "commercial" && content.warrantyMonths === null && f.warranty.trim() !== "") allErrs.warrantyMonths = "Enter whole months";
    if (mode === "draft") {
      const d = productDraftSchema.safeParse({ title: content.title, sku: f.sku });
      if (!d.success) for (const i of d.error.issues) allErrs[String(i.path[0])] ??= i.message;
    }
    if (mode === "submit" || mode === "revision") {
      const c = productContentSchema.safeParse(content);
      if (!c.success) for (const i of c.error.issues) allErrs[String(i.path[0])] ??= i.message;
    }
    if (Object.keys(allErrs).length || !commercial) return fail(allErrs);

    setBusy(mode);
    try {
      let saved: VendorProduct;
      if (isNew) {
        const res = await api<{ product: VendorProduct }>("/api/vendor/products", {
          method: "POST",
          body: { content, commercial, submit: mode === "submit" },
        });
        saved = res.product;
        router.replace(`${base}/${saved.id}?${mode === "submit" ? "submitted" : "created"}=1`);
        router.refresh();
        return;
      }
      const body =
        mode === "commercial" ? { commercial } : mode === "submit" ? { content, commercial, submit: true } : { content, commercial };
      const res = await api<{ product: VendorProduct }>(`/api/vendor/products/${product!.id}`, { method: "PATCH", body });
      saved = res.product;
      setProduct(saved);
      if (mode !== "commercial") setF(initialState(saved));
      router.refresh();
      show(
        "ok",
        mode === "submit"
          ? "Submitted for review. We will notify you with the decision."
          : mode === "revision"
            ? "Changes sent for review. Your live listing stays as it is until they are approved."
            : mode === "commercial"
              ? "Price and stock saved."
              : "Draft saved.",
      );
    } catch (err) {
      if (err instanceof ApiFailure && Object.keys(err.fields).length) fail(fieldErrors(err.fields));
      else show("error", failureMessage(err));
    } finally {
      setBusy(null);
    }
  }

  /* ---- numbers for the preview ---- */
  const mrpN = toInt(f.mrp);
  const priceN = toInt(f.price);
  const rate = commissionRate ?? DEFAULT_COMMISSION_RATE;
  const discount = mrpN && priceN && mrpN > 0 && priceN <= mrpN ? Math.round(((mrpN - priceN) / mrpN) * 100) : null;
  const payout = priceN && priceN > 0 ? settlementFor(priceN, rate) : null;

  /* ---- small render helpers ---- */
  const a = (name: string) => ({
    id: `f-${name}`,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `e-${name}` : undefined,
  });
  const invalidCls = (n: string) => (errors[n] ? "!border-danger" : "");
  const section = "card space-y-4 p-4 md:p-5";
  const h2 = "font-display text-lg font-extrabold text-chalk";
  const smallBtn = "btn btn-outline btn-sm disabled:pointer-events-none disabled:opacity-40";
  const iconBtn = "grid h-11 w-11 shrink-0 place-items-center rounded-[2px] border border-tint/10 text-ash hover:border-danger hover:text-danger disabled:pointer-events-none disabled:opacity-40";

  const primaryBtn = (label: string, mode: Mode, primary = true) => (
    <button
      type="button"
      onClick={() => save(mode)}
      disabled={busy !== null}
      className={`btn ${primary ? "btn-primary" : "btn-outline"} disabled:opacity-60`}
    >
      {busy === mode ? "Saving…" : label}
    </button>
  );

  return (
    <form
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="space-y-5 pb-24 lg:pb-0"
      aria-label={isNew ? "Add a product" : "Edit product"}
    >
      <div>
        <Link href={base} className="inline-flex min-h-10 items-center gap-1.5 text-sm text-ash hover:text-accent">
          <ArrowLeft size={16} aria-hidden /> All products
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="display-3">{isNew ? "Add a product" : f.title || "Edit product"}</h1>
          {product && <StatusBadge product={product} />}
        </div>
      </div>

      {readOnly && <ReadOnlyNotice />}
      {product?.status === "changes_requested" && product.reviewNotes && (
        <p role="note" className="rounded-[2px] border border-gold/30 bg-gold/10 p-3 text-sm text-chalk">
          <strong className="text-gold">Changes requested:</strong> {product.reviewNotes.note}
        </p>
      )}
      {product?.status === "rejected" && product.rejectionReason && (
        <p role="note" className="rounded-[2px] border border-danger/30 bg-danger/10 p-3 text-sm text-chalk">
          <strong className="text-danger">Rejected:</strong> {product.rejectionReason} You can edit and submit it again.
        </p>
      )}
      {status === "pending_review" && !readOnly && (
        <p role="note" className="rounded-[2px] border border-gold/30 bg-gold/10 p-3 text-sm text-chalk">
          This product is waiting for review, so its details are locked. You can still change price, stock and SKU.
        </p>
      )}
      {status === "archived" && !readOnly && (
        <p role="note" className="rounded-[2px] border border-tint/10 bg-steel p-3 text-sm text-ash">
          This product is archived. Restore it from the products list to edit it.
        </p>
      )}
      {isLive && product?.pendingRevision && (
        <p role="note" className="rounded-[2px] border border-gold/30 bg-gold/10 p-3 text-sm text-chalk">
          You are viewing your edits that are waiting for review. The shop still shows the approved version.
        </p>
      )}
      {isLive && !product?.pendingRevision && !readOnly && (
        <p role="note" className="rounded-[2px] border border-tint/10 bg-steel p-3 text-sm text-ash">
          Price, stock and SKU changes apply immediately. Changes to other details are reviewed first; the current listing stays live meanwhile.
        </p>
      )}

      <fieldset disabled={contentLocked} className={`${section} min-w-0`}>
        <legend className="sr-only">Product details</legend>
        <h2 className={h2}>Product details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field error={errors.title} name="title" label="Title" className="md:col-span-2">
            <input {...a("title")} className={`field ${invalidCls("title")}`} value={f.title} maxLength={120} onChange={(e) => set("title", e.target.value)} autoComplete="off" />
          </Field>
          <Field error={errors.brand} name="brand" label="Brand">
            <input {...a("brand")} className={`field ${invalidCls("brand")}`} value={f.brand} maxLength={60} onChange={(e) => set("brand", e.target.value)} autoComplete="off" />
          </Field>
          <Field error={errors.partType} name="partType" label="Part type">
            <select {...a("partType")} className="field" value={f.partType} onChange={(e) => set("partType", e.target.value as PartType)}>
              {PART_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PART_TYPE_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field error={errors.department} name="department" label="Department">
            <select
              {...a("department")}
              className="field"
              value={f.department}
              onChange={(e) => setF((s) => ({ ...s, department: e.target.value as DepartmentSlug, groupSlug: "" }))}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field error={errors.groupSlug} name="groupSlug" label="Category">
            <select {...a("groupSlug")} className={`field ${invalidCls("groupSlug")}`} value={f.groupSlug} onChange={(e) => set("groupSlug", e.target.value)}>
              <option value="">Select a category</option>
              {groups.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Field error={errors.summary} name="summary" label="Description" hint="What it is, what it is made of, what is in the box." className="md:col-span-2">
            <textarea {...a("summary")} className={`field min-h-32 py-3 ${invalidCls("summary")}`} value={f.summary} maxLength={1500} onChange={(e) => set("summary", e.target.value)} />
            <p className="mt-1 text-right text-xs text-dim tnum">{f.summary.length}/1500</p>
          </Field>
        </div>

        <div id="f-highlights" tabIndex={-1} className="outline-none">
          <p className="label">Highlights (up to 8)</p>
          <div className="space-y-2">
            {f.highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <label className="sr-only" htmlFor={`highlight-${i}`}>
                  Highlight {i + 1}
                </label>
                <input
                  id={`highlight-${i}`}
                  className="field"
                  value={h}
                  maxLength={140}
                  onChange={(e) => set("highlights", f.highlights.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button type="button" className={iconBtn} aria-label={`Remove highlight ${i + 1}`} onClick={() => set("highlights", f.highlights.filter((_, j) => j !== i))}>
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
          {f.highlights.length < 8 && (
            <button type="button" className={`${smallBtn} mt-2`} onClick={() => set("highlights", [...f.highlights, ""])}>
              <Plus size={14} aria-hidden /> Add highlight
            </button>
          )}
          <Err name="highlights" error={errors.highlights} />
        </div>

        <div id="f-specs" tabIndex={-1} className="outline-none">
          <p className="label">Specifications (up to 20)</p>
          <div className="space-y-2">
            {f.specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <label className="sr-only" htmlFor={`spec-l-${i}`}>
                  Specification {i + 1} name
                </label>
                <input id={`spec-l-${i}`} className="field" placeholder="e.g. Material" value={s.label} maxLength={40} onChange={(e) => set("specs", f.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <label className="sr-only" htmlFor={`spec-v-${i}`}>
                  Specification {i + 1} value
                </label>
                <input id={`spec-v-${i}`} className="field" placeholder="e.g. Neoprene" value={s.value} maxLength={120} onChange={(e) => set("specs", f.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <button type="button" className={iconBtn} aria-label={`Remove specification ${i + 1}`} onClick={() => set("specs", f.specs.filter((_, j) => j !== i))}>
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
          {f.specs.length < 20 && (
            <button type="button" className={`${smallBtn} mt-2`} onClick={() => set("specs", [...f.specs, { label: "", value: "" }])}>
              <Plus size={14} aria-hidden /> Add specification
            </button>
          )}
          <Err name="specs" error={errors.specs} />
        </div>

        <div>
          <p className="label" id="fitment-label">
            Fits
          </p>
          <FitmentPicker value={f.fitment} onChange={(v) => set("fitment", v)} disabled={contentLocked} invalid={!!errors.fitment} describedBy={errors.fitment ? "e-fitment" : undefined} />
          <Err name="fitment" error={errors.fitment} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field error={errors.warrantyMonths} name="warrantyMonths" label="Warranty (months)" hint="Leave blank for none.">
            <input {...a("warrantyMonths")} className={`field ${invalidCls("warrantyMonths")}`} inputMode="numeric" value={f.warranty} onChange={(e) => set("warranty", e.target.value.replace(/\D/g, "").slice(0, 3))} />
          </Field>
          <Field error={errors.hsn} name="hsn" label="HSN code" hint="4, 6 or 8 digits.">
            <input {...a("hsn")} className={`field ${invalidCls("hsn")}`} inputMode="numeric" value={f.hsn} onChange={(e) => set("hsn", e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </Field>
          <Field error={errors.gstRate} name="gstRate" label="GST rate">
            <select {...a("gstRate")} className="field" value={f.gstRate} onChange={(e) => set("gstRate", e.target.value)}>
              {GST_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <p className="label">Photos (1–8)</p>
          <ProductImages value={f.images} onChange={(v) => set("images", v)} disabled={contentLocked} invalid={!!errors.images} describedBy={errors.images ? "e-images" : undefined} />
          <Err name="images" error={errors.images} />
        </div>
      </fieldset>

      <fieldset disabled={commercialLocked} className={`${section} min-w-0`}>
        <legend className="sr-only">Price and stock</legend>
        <h2 className={h2}>Price and stock</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field error={errors.sku} name="sku" label="SKU" className="sm:col-span-2 lg:col-span-1">
            <input {...a("sku")} className={`field ${invalidCls("sku")}`} value={f.sku} maxLength={40} onChange={(e) => set("sku", e.target.value)} autoComplete="off" />
          </Field>
          <Field error={errors.mrp} name="mrp" label="MRP (₹)" hint="Incl. GST">
            <input {...a("mrp")} className={`field ${invalidCls("mrp")}`} inputMode="numeric" value={f.mrp} onChange={(e) => set("mrp", e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </Field>
          <Field error={errors.price} name="price" label="Selling price (₹)" hint="Incl. GST">
            <input {...a("price")} className={`field ${invalidCls("price")}`} inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </Field>
          <Field error={errors.stock} name="stock" label="Stock">
            <input {...a("stock")} className={`field ${invalidCls("stock")}`} inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </Field>
          <Field error={errors.lowStockAt} name="lowStockAt" label="Low-stock alert at">
            <input {...a("lowStockAt")} className={`field ${invalidCls("lowStockAt")}`} inputMode="numeric" value={f.lowStockAt} onChange={(e) => set("lowStockAt", e.target.value.replace(/\D/g, "").slice(0, 5))} />
          </Field>
        </div>

        <div className="grid gap-3 rounded-[2px] border border-tint/10 bg-carbon p-3 text-sm sm:grid-cols-2" aria-live="polite">
          <div>
            <p className="label !mb-1">Discount</p>
            <p className="font-display text-xl font-extrabold text-chalk tnum">{discount === null ? "—" : `${discount}% off MRP`}</p>
          </div>
          <div>
            <p className="label !mb-1">You receive per unit</p>
            <p className="font-display text-xl font-extrabold text-accent tnum">{payout ? rupees(payout.net) : "—"}</p>
            {payout && (
              <p className="mt-1 text-xs text-ash tnum">
                {rupees(payout.gross)} − commission {rupees(payout.commission)} ({rate}%) − GST on commission {rupees(payout.commissionGst)}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {!readOnly && status !== "archived" && (
        <div className="fixed inset-x-0 bottom-16 z-40 flex flex-wrap items-center justify-end gap-2 border-t border-tint/10 bg-void/95 p-3 backdrop-blur lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          {(isNew || editable) && (
            <>
              {primaryBtn("Save draft", "draft", false)}
              {primaryBtn("Submit for review", "submit")}
            </>
          )}
          {status === "pending_review" && primaryBtn("Save price & stock", "commercial")}
          {isLive && (
            <>
              {primaryBtn("Save price & stock", "commercial", false)}
              {primaryBtn("Submit changes for review", "revision")}
            </>
          )}
        </div>
      )}
      {node}
    </form>
  );
}
