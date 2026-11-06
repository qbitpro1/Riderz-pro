"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { BRANDS } from "@/lib/data/vehicles";
import { useGarage, writeGarage } from "@/lib/client/garage";
import { Sheet } from "./MobileSheets";
import {
  EMPTY_SELECTION,
  barState,
  canSubmit,
  carTitle,
  choose,
  findCar,
  fromSavedCar,
  missingStep,
  stepEnabled,
  toSavedCar,
  type Selection,
  type Step,
} from "./vehicleBarState";

const STEP_LABEL: Record<Step, string> = { brand: "Brand", model: "Model", variant: "Variant", year: "Year" };

/**
 * "What do you drive?" above a listing. Empty: the four selects. Saved: a dark bar naming the car,
 * and the listing shows only parts that fit (CatalogBrowser reads the same saved car). The car is
 * kept by lib/client/garage (localStorage, with the account in sync), so it survives a reload.
 *
 * Both states keep the same height on each breakpoint, so switching never shifts the page.
 */
export function VehicleBar() {
  const car = useGarage();
  const state = barState(car);
  const [sel, setSel] = useState<Selection>(EMPTY_SELECTION);
  const [sheetOpen, setSheetOpen] = useState(false);

  function change() {
    if (car) setSel(fromSavedCar(car));
    writeGarage(null);
  }

  if (state.kind === "saved") {
    const t = carTitle(BRANDS, state.car);
    return (
      <section aria-label="Your car" className="rounded-[var(--radius-cl)] bg-cl-bar text-cl-on-bar">
        <div className="flex min-h-[72px] items-center gap-3 px-4 py-3 md:min-h-[90px] md:gap-4 md:px-5">
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-white/10 md:grid">
            <Icon name="car" size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/75">Shopping for</p>
            <p className="truncate font-display text-[17px] font-extrabold md:text-[20px]">
              {t.name}
              {t.detail && <span className="font-sans text-[15px] font-medium text-white/80 md:text-[17px]"> · {t.detail}</span>}
            </p>
          </div>
          <p className="hidden shrink-0 items-center gap-1.5 rounded-full bg-cl-bar-fit-bg px-3 py-1.5 text-[13px] font-semibold text-cl-bar-fit lg:inline-flex">
            <Icon name="check" size={14} />
            Showing only parts that fit
          </p>
          <button
            type="button"
            onClick={change}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-[var(--radius-cl-ctl)] border border-white/40 px-4 text-[14px] font-semibold hover:border-white"
          >
            <span className="md:hidden">Change</span>
            <span className="hidden md:inline">Change car</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* phone: one tappable card that opens the picker */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        className="flex min-h-[72px] w-full items-center gap-3 rounded-[var(--radius-cl)] border-2 border-dashed border-cl-line-strong bg-cl-surface px-4 text-left md:hidden"
      >
        <CarIcon />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[16px] font-extrabold">Add your car</span>
          <span className="block text-[13px] text-cl-muted">See only parts that fit</span>
        </span>
        <Icon name="chevron" size={18} />
      </button>
      {sheetOpen && (
        <Sheet title="Your car" onClose={() => setSheetOpen(false)}>
          <PickerForm sel={sel} onChange={setSel} stacked onSaved={() => setSheetOpen(false)} />
        </Sheet>
      )}

      {/* tablet and up: the selects in one row */}
      <section
        aria-labelledby="vb-title"
        className="hidden min-h-[90px] items-center gap-x-5 gap-y-3 rounded-[var(--radius-cl)] border border-cl-line bg-cl-surface px-5 py-4 md:flex md:flex-wrap xl:flex-nowrap"
      >
        <div className="flex basis-full items-center gap-3 xl:basis-auto xl:min-w-[15rem]">
          <CarIcon />
          <div>
            <h2 id="vb-title" className="font-display text-[20px] font-extrabold leading-tight">
              What do you drive?
            </h2>
            <p className="text-[13px] text-cl-muted">Only see parts confirmed to fit your car.</p>
          </div>
        </div>
        <PickerForm sel={sel} onChange={setSel} />
      </section>
    </>
  );
}

function CarIcon() {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-cl-sale-tint text-cl-sale">
      <Icon name="car" size={26} />
    </span>
  );
}

/** The four selects and the button; `stacked` for the phone sheet. */
function PickerForm({
  sel,
  onChange,
  stacked = false,
  onSaved,
}: {
  sel: Selection;
  onChange: (s: Selection) => void;
  stacked?: boolean;
  onSaved?: () => void;
}) {
  const uid = useId();
  const refs = useRef<Partial<Record<Step, HTMLSelectElement | null>>>({});
  const [hint, setHint] = useState<Step | null>(null);
  const { brand, model } = findCar(BRANDS, sel);

  const options: Record<Step, { value: string; label: string }[]> = {
    brand: BRANDS.map((b) => ({ value: b.slug, label: b.name })),
    model: brand?.models.map((m) => ({ value: m.slug, label: m.name })) ?? [],
    variant: model?.variants.map((v) => ({ value: v, label: v })) ?? [],
    year: model?.years.map((y) => ({ value: String(y), label: String(y) })) ?? [],
  };
  const placeholder = (s: Step) =>
    stepEnabled(sel, s) ? `Select ${STEP_LABEL[s].toLowerCase()}` : s === "model" ? "Pick a brand first" : "Pick a model first";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing = missingStep(sel);
    if (missing) {
      // Enabled from the first choice: point at the next step rather than looking disabled.
      setHint(missing);
      refs.current[missing]?.focus();
      return;
    }
    const car = toSavedCar(BRANDS, sel);
    if (!car) return;
    setHint(null);
    writeGarage(car);
    onSaved?.();
  }

  return (
    <form onSubmit={submit} className={`flex min-w-0 flex-1 gap-3 ${stacked ? "flex-col" : "flex-wrap items-end lg:flex-nowrap"}`} noValidate>
      {(["brand", "model", "variant", "year"] as Step[]).map((s) => (
        <div key={s} className={stacked ? "" : "min-w-[8.5rem] flex-1"}>
          <label htmlFor={`${uid}-${s}`} className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cl-muted">
            {STEP_LABEL[s]}
          </label>
          <select
            id={`${uid}-${s}`}
            ref={(el) => {
              refs.current[s] = el;
            }}
            className="cl-input"
            value={sel[s]}
            disabled={!stepEnabled(sel, s)}
            aria-invalid={hint === s || undefined}
            aria-describedby={hint === s ? `${uid}-hint` : undefined}
            onChange={(e) => {
              onChange(choose(sel, s, e.target.value));
              if (hint === s) setHint(null);
            }}
          >
            <option value="">{placeholder(s)}</option>
            {options[s].map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className={stacked ? "pt-1" : "shrink-0"}>
        <button type="submit" disabled={!canSubmit(sel)} className={`cl-btn cl-btn-primary whitespace-nowrap ${stacked ? "w-full" : ""}`}>
          Show parts that fit
        </button>
      </div>
      <p id={`${uid}-hint`} role="status" className={`text-[13px] text-cl-muted ${stacked ? "" : "sr-only"}`}>
        {hint ? `Choose the ${STEP_LABEL[hint].toLowerCase()} to continue.` : ""}
      </p>
    </form>
  );
}
