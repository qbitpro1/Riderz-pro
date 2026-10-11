import { DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import type { ProductDetail } from "@/lib/store/types";

/** Summary, highlights, specs and the "product details" block, from the data only. */
export function ProductDetails({ detail }: { detail: ProductDetail }) {
  const facts: { label: string; value: string }[] = [
    { label: "Brand", value: detail.brandName },
    ...(detail.code ? [{ label: "Model no.", value: detail.code }] : []),
    { label: "Category", value: `${DEPARTMENT_BY_SLUG[detail.department].name} · ${detail.groupName}` },
    ...(detail.source ? [{ label: "Source", value: detail.source }] : []),
    ...(detail.warranty ? [{ label: "Warranty", value: detail.warranty }] : []),
    ...(detail.delivery ? [{ label: "Delivery", value: detail.delivery }] : []),
  ];

  return (
    <div className="grid gap-8 md:gap-10 lg:grid-cols-2">
      <div className="min-w-0 space-y-8">
        {detail.summary && (
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">About this product</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash md:text-base">{detail.summary}</p>
          </div>
        )}
        {detail.highlights.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">Highlights</h2>
            <ul className="mt-3 space-y-2 text-sm text-ash md:text-base">
              {detail.highlights.map((h) => (
                <li key={h} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">Product details</h2>
          <dl className="mt-3 divide-y divide-tint/8 border-y border-tint/8">
            {facts.map((f) => (
              <Row key={f.label} label={f.label} value={f.value} />
            ))}
          </dl>
        </div>
      </div>

      {detail.specs.length > 0 && (
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">Specifications</h2>
          <dl className="mt-3 divide-y divide-tint/8 border-y border-tint/8">
            {detail.specs.map((s) => (
              <Row key={s.label} label={s.label} value={s.value} />
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="shrink-0 text-sm text-dim">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm">{value}</dd>
    </div>
  );
}
