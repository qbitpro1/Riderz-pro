"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { emi, rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export function EmiCalculator({
  defaultPrice = 15_75_000,
  context = "a vehicle",
}: {
  defaultPrice?: number;
  context?: string;
}) {
  const [price, setPrice] = useState(defaultPrice);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(9.5);
  const [months, setMonths] = useState(60);

  const { monthly, principal, interest, total } = useMemo(() => {
    const down = Math.round((price * downPct) / 100);
    const p = Math.max(price - down, 0);
    const m = emi(p, rate, months);
    const t = m * months;
    return { monthly: m, principal: p, interest: t - p, total: t };
  }, [price, downPct, rate, months]);

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Icon name="spark" size={16} className="text-accent" />
        <h3 className="font-display text-lg font-extrabold uppercase tracking-[-0.02em]">
          EMI Calculator
        </h3>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <Slider
            label="Vehicle price"
            value={price}
            min={50_000}
            max={1_00_00_000}
            step={25_000}
            display={rupees(price)}
            onChange={setPrice}
          />
          <Slider
            label="Down payment"
            value={downPct}
            min={0}
            max={80}
            step={5}
            display={`${downPct}% · ${rupees((price * downPct) / 100)}`}
            onChange={setDownPct}
          />
          <Slider
            label="Interest rate"
            value={rate}
            min={7}
            max={18}
            step={0.25}
            display={`${rate.toFixed(2)}% p.a.`}
            onChange={setRate}
          />
          <div>
            <p className="label">Loan duration</p>
            <div className="flex flex-wrap gap-2">
              {[12, 24, 36, 48, 60, 72, 84].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`chip ${months === m ? "chip-active" : "hover:border-accent hover:text-accent"}`}
                >
                  {m / 12} yr
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between border border-tint/8 bg-tint/3 p-5">
          <div>
            <p className="label mb-1">Estimated monthly EMI</p>
            <p className="font-display text-4xl font-extrabold tracking-[-0.04em] text-accent tnum">
              {rupees(monthly)}
            </p>
            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Loan amount" value={rupees(principal)} />
              <Row label="Total interest" value={rupees(interest)} />
              <Row label="Total payable" value={rupees(total)} />
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-dim">
              Indicative only. Final rate depends on your credit profile, lender and tenure. We work
              with 11 lenders and will find you the cheapest available offer.
            </p>
          </div>
          <a
            href={whatsapp(
              `Hi Riderzpro, I want finance for ${context}. Price ${rupees(price)}, down payment ${downPct}%, tenure ${months} months.`,
            )}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-whatsapp btn-block mt-5"
          >
            <Icon name="whatsapp" size={16} />
            Check my eligibility
          </a>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="label mb-0" htmlFor={`emi-${label}`}>
          {label}
        </label>
        <span className="font-display text-sm font-bold tnum">{display}</span>
      </div>
      <input
        id={`emi-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-tint/12 accent-[var(--color-accent)]"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ash">{label}</dt>
      <dd className="font-semibold tnum">{value}</dd>
    </div>
  );
}
