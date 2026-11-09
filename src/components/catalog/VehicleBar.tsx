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
      <section
        aria-label="Your car"
        className="relative overflow-hidden rounded-[24px] bg-cl-bar text-cl-on-bar shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_50px_-28px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
      >
        {/* Soft colour wash so the dark bar reads as tinted glass, not a flat slab. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,rgba(255,80,70,0.22),transparent_60%),radial-gradient(50%_120%_at_100%_100%,rgba(70,140,255,0.2),transparent_60%)]"
        />
        <div className="relative flex min-h-[72px] items-center gap-3 px-4 py-3 md:min-h-[90px] md:gap-4 md:px-6">
          <span className="fs-icon hidden h-12 w-12 md:grid">
            <Icon name="car" size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Shopping for</p>
            <p className="truncate text-[17px] font-semibold tracking-[-0.02em] md:text-[20px]">
              {t.name}
              {t.detail && <span className="font-sans text-[15px] font-medium text-white/80 md:text-[17px]"> · {t.detail}</span>}
            </p>
          </div>
          <p className="hidden shrink-0 items-center gap-1.5 rounded-full bg-cl-bar-fit-bg/80 px-3 py-1.5 text-[13px] font-semibold text-cl-bar-fit ring-1 ring-white/10 backdrop-blur lg:inline-flex">
            <Icon name="check" size={14} />
            Showing only parts that fit
          </p>
          <button
            type="button"
            onClick={change}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-white/12 px-4 text-[14px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20 active:scale-[0.97]"
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
        className="fs-glass flex min-h-[72px] w-full items-center gap-3 px-4 text-left transition-transform active:scale-[0.99] md:hidden"
      >
        <CarIcon />
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold tracking-[-0.01em]">Add your car</span>
          <span className="block text-[13px] text-cl-muted">See only parts that fit</span>
        </span>
        <span className="fs-well grid h-8 w-8 shrink-0 place-items-center rounded-full text-cl-muted" aria-hidden="true">
          <Icon name="chevron" size={15} />
        </span>
      </button>
      {sheetOpen && (
        <Sheet title="Your car" onClose={() => setSheetOpen(false)}>
          <PickerForm sel={sel} onChange={setSel} stacked onSaved={() => setSheetOpen(false)} />
        </Sheet>
      )}

      {/* tablet and up: the selects in one row */}
      <section
        aria-labelledby="vb-title"
        className="fs-glass hidden min-h-[90px] items-center gap-x-6 gap-y-4 px-6 py-5 md:flex md:flex-wrap xl:flex-nowrap"
      >
        <div className="flex basis-full items-center gap-3 xl:basis-auto xl:min-w-[15rem]">
          <CarIcon />
          <div>
            <h2 id="vb-title" className="text-[19px] font-semibold leading-tight tracking-[-0.02em]">
              What do you drive?
            </h2>
            <p className="mt-0.5 text-[13px] text-cl-muted">Only see parts confirmed to fit your car.</p>
          </div>
        </div>
        <PickerForm sel={sel} onChange={setSel} />
      </section>
    </>
  );
}

function CarIcon() {
  return (
    <span className="fs-icon h-12 w-12" aria-hidden="true">
      <Icon name="car" size={24} />
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
          <label htmlFor={`${uid}-${s}`} className="mb-1.5 block pl-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-cl-muted">
            {STEP_LABEL[s]}
          </label>
          <select
            id={`${uid}-${s}`}
            ref={(el) => {
              refs.current[s] = el;
            }}
            className="fs-well fs-field"
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
        <button type="submit" disabled={!canSubmit(sel)} className={`fs-btn whitespace-nowrap ${stacked ? "w-full" : ""}`}>
          Show parts that fit
        </button>
      </div>
      <p id={`${uid}-hint`} role="status" className={`text-[13px] text-cl-muted ${stacked ? "" : "sr-only"}`}>
        {hint ? `Choose the ${STEP_LABEL[hint].toLowerCase()} to continue.` : ""}
      </p>
    </form>
  );
}
