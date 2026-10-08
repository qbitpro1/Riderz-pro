import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { INSPECTION_POINTS, type ConditionReport, type Listing } from "@/lib/inventory/types";
import { attributionFor, verifiedBadgeAllowed } from "@/lib/inventory/compliance";
import { formatIST, priceChange, priceNeedsConfirmation, relativeAge } from "@/lib/inventory/freshness";
import { lakh, rupees } from "@/lib/format";

/** The banner that tells a buyer exactly whose word they are taking. */
export function ProvenanceBanner({ listing }: { listing: Listing }) {
  const verified = verifiedBadgeAllowed(listing);
  const attribution = attributionFor(listing);
  const age = relativeAge(listing.listedAt ?? listing.discoveredAt);
  const needsConfirmation = priceNeedsConfirmation(listing);

  return (
    <div className={`card p-5 ${verified ? "border-accent/35 bg-accent/6" : "border-gold/25 bg-gold/5"}`}>
      <p className={`flex items-center gap-2 font-display text-sm font-extrabold uppercase ${verified ? "text-accent" : "text-gold"}`}>
        <Icon name="shield" size={16} />
        {verified ? "Motorbotz Verified" : attribution.label}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-chalk/85">
        {verified
          ? "Motorbotz has physically inspected this car. The 12-point report is published below and the documents have been checked against the vehicle."
          : "Motorbotz has not inspected this car. Everything below is as supplied by the source and is shown unverified — request an inspection and we will check it for you before you commit."}
      </p>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        {attribution.showSourceName && attribution.sourceName && (
          <Row label="Source" value={attribution.sourceName} />
        )}
        {age && <Row label="Listed" value={age} />}
        <Row label="Last verified" value={formatIST(listing.lastVerifiedAt)} />
        <Row label="Status" value={statusLabel(listing.status)} />
      </dl>

      {attribution.url && (
        <a
          href={attribution.url}
          target="_blank"
          rel="noreferrer noopener nofollow"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent underline underline-offset-4"
        >
          View original listing
          <Icon name="arrow" size={13} />
        </a>
      )}

      {needsConfirmation && (
        <p className="mt-3 flex items-start gap-2 border-t border-white/10 pt-3 text-xs text-gold">
          <Icon name="shield" size={13} className="mt-0.5 shrink-0" />
          Price and availability need confirmation — this listing has not been re-verified recently.
        </p>
      )}

      {listing.demo && (
        <p className="mt-3 border-t border-white/10 pt-3 text-[11px] text-dim">
          Sample record from the design build. Not live inventory.
        </p>
      )}
    </div>
  );
}

export function PriceBlock({ listing }: { listing: Listing }) {
  const drop = priceChange(listing.priceHistory);
  if (listing.price == null) {
    return <p className="font-display text-2xl uppercase text-ash">Price on request</p>;
  }
  return (
    <div>
      <p className="label mb-1">Listed price</p>
      {drop?.direction === "drop" && <p className="text-sm text-dim line-through tnum">{lakh(drop.previous)}</p>}
      <p className="font-display text-4xl font-extrabold tracking-[-0.04em] tnum">{lakh(listing.price)}</p>
      {drop?.direction === "drop" && (
        <p className="mt-1 text-sm text-accent tnum">{rupees(drop.delta)} price drop</p>
      )}
      <p className="mt-1 text-xs text-dim">Last verified {formatIST(listing.lastVerifiedAt)}</p>
    </div>
  );
}

const CONDITION_LABELS: { key: keyof ConditionReport; label: string }[] = [
  { key: "exterior", label: "Exterior" },
  { key: "interior", label: "Interior" },
  { key: "tyres", label: "Tyres" },
  { key: "mechanical", label: "Mechanical" },
  { key: "accidentHistory", label: "Accident history" },
  { key: "insurance", label: "Insurance" },
  { key: "serviceHistory", label: "Service history" },
  { key: "rc", label: "RC" },
  { key: "pollutionCertificate", label: "Pollution certificate" },
  { key: "numberOfKeys", label: "Number of keys" },
];

/** Source claims and Motorbotz findings sit in separate columns, always. */
export function ConditionTable({ listing }: { listing: Listing }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
            <th className="p-2.5">Item</th>
            <th className="p-2.5">Source reported</th>
            <th className="p-2.5">Motorbotz verified</th>
          </tr>
        </thead>
        <tbody>
          {CONDITION_LABELS.map(({ key, label }) => {
            const field = listing.condition[key];
            return (
              <tr key={key} className="border-b border-white/8 align-top">
                <th className="p-2.5 text-left text-xs font-medium text-dim">{label}</th>
                <td className="p-2.5 text-xs">
                  {field.sourceReported ?? <span className="text-dim">Not specified</span>}
                </td>
                <td className="p-2.5 text-xs">
                  {field.motorbotzVerified ? (
                    <span className="flex items-start gap-1.5 text-accent">
                      <Icon name="check" size={12} className="mt-0.5 shrink-0" />
                      {field.motorbotzVerified}
                    </span>
                  ) : (
                    <span className="text-gold">Not verified</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function InspectionReport({ listing }: { listing: Listing }) {
  if (!listing.inspection) {
    return (
      <div className="card p-5">
        <p className="font-display text-sm font-extrabold uppercase text-gold">Not yet inspected</p>
        <p className="mt-2 text-sm text-ash">
          No Motorbotz inspection has been carried out on this car. All twelve points below are open.
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {INSPECTION_POINTS.map((p) => (
            <li key={p} className="chip text-dim">
              {p}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="verified mb-3">
        <Icon name="shield" size={12} />
        Motorbotz Inspected
      </p>
      <p className="text-xs text-dim">
        {formatIST(listing.inspection.inspectedAt)} · {listing.inspection.inspector}
      </p>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {listing.inspection.results.map((r) => (
          <li key={r.point} className="flex items-start gap-2 text-sm">
            <Icon name={r.pass ? "check" : "close"} size={14} className={`mt-0.5 shrink-0 ${r.pass ? "text-accent" : "text-danger"}`} />
            <span>
              {r.point}
              {r.note && <span className="block text-xs text-dim">{r.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Buy it, then build it — the reason a buyer should come to us and not a listing site. */
export function BuildItNext({ listing }: { listing: Listing }) {
  const offroad = listing.drivetrain === "4WD" || listing.drivetrain === "AWD" || listing.bodyType === "Off-Roader";
  const luxury = ["BMW", "Mercedes-Benz", "Audi", "Volvo", "Jaguar", "Land Rover", "Lexus", "Porsche", "MINI"].includes(listing.make);

  const picks = [
    { label: "Premium audio", href: "/audio" },
    { label: "PPF & ceramic", href: "/ppf" },
    ...(offroad
      ? [
          { label: "Off-road suspension", href: "/off-road" },
          { label: "All-terrain tyres", href: "/shop/off-road" },
          { label: "Roof rack", href: "/shop/off-road" },
          { label: "LED lighting", href: "/shop/lighting" },
        ]
      : [
          { label: "Body kit & facelift", href: "/body-kits" },
          { label: "Performance", href: "/performance" },
          { label: "LED lighting", href: "/shop/lighting" },
        ]),
    { label: luxury ? "Custom interior" : "Interior upgrade", href: "/interiors" },
    { label: "Detailing", href: "/ppf" },
  ];

  return (
    <div className="card p-6">
      <p className="eyebrow mb-2">Motorbotz can also help you with</p>
      <h2 className="display-3">BUY IT. THEN BUILD IT.</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ash">
        Every car we sell can go straight from handover into our workshop. Roll the build into the
        same finance and collect it finished.
      </p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {picks.map((p) => (
          <li key={p.label}>
            <Link href={p.href} className="chip hover:border-accent hover:text-accent">
              <Icon name="chevron" size={11} className="text-accent" />
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/build" className="btn btn-accent btn-sm mt-6">
        Build this {listing.model}
        <Icon name="arrow" size={14} />
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-dim">{label}</dt>
      <dd className="text-ash">{value}</dd>
    </div>
  );
}

function statusLabel(status: Listing["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "Available";
    case "PRICE_UPDATED":
      return "Available · price updated";
    case "SOLD_UNAVAILABLE":
      return "Sold or unavailable";
    case "STALE":
      return "Needs re-verification";
    case "SOURCE_ERROR":
      return "Could not verify with source";
    case "ARCHIVED":
      return "Archived";
  }
}
