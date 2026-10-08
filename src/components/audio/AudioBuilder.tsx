"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { AUDIO_STAGES } from "@/lib/data/services";

type Choice = Record<string, number>;

export function AudioBuilder() {
  const [choice, setChoice] = useState<Choice>(() =>
    Object.fromEntries(AUDIO_STAGES.map((s) => [s.key, 0])),
  );

  const lines = useMemo(
    () =>
      AUDIO_STAGES.map((s) => ({
        label: s.label,
        option: s.options[choice[s.key] ?? 0],
      })),
    [choice],
  );

  const total = lines.reduce((n, l) => n + l.option.price, 0);
  const labour = Math.round(total * 0.1);
  const grand = total + labour;

  const message = [
    "Hi Riderzpro, I designed an audio system on the website:",
    "",
    ...lines.map((l) => `• ${l.label}: ${l.option.name} (${rupees(l.option.price)})`),
    "",
    `Estimated total with installation: ${rupees(grand)}`,
    "My car is: ",
  ].join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="space-y-4">
        {AUDIO_STAGES.map((stage) => (
          <fieldset key={stage.key} className="card p-5">
            <legend className="eyebrow px-1">{stage.label}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {stage.options.map((opt, i) => {
                const on = (choice[stage.key] ?? 0) === i;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChoice((c) => ({ ...c, [stage.key]: i }))}
                    className={`flex h-full flex-col justify-between gap-3 border p-3 text-left transition-colors ${
                      on ? "border-accent/60 bg-accent/10" : "border-white/8 bg-white/2 hover:border-white/25"
                    }`}
                  >
                    <span className="text-sm font-medium leading-snug">{opt.name}</span>
                    <span className={`text-xs tnum ${on ? "text-accent" : "text-dim"}`}>
                      {opt.price === 0 ? "No cost" : `+ ${rupees(opt.price)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="card p-5">
          <p className="eyebrow mb-1">Your system</p>
          <p className="font-display text-4xl font-extrabold tracking-[-0.045em] tnum">
            {rupees(grand)}
          </p>
          <p className="mt-1 text-xs text-dim">Parts {rupees(total)} + installation {rupees(labour)}</p>

          <ul className="mt-5 space-y-2.5 border-t border-white/8 pt-4 text-sm">
            {lines.map((l) => (
              <li key={l.label} className="flex items-start justify-between gap-3">
                <span className="text-dim">{l.label}</span>
                <span className="max-w-[60%] text-right leading-snug">{l.option.name}</span>
              </li>
            ))}
          </ul>

          <a
            href={whatsapp(message)}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-accent btn-block mt-5"
          >
            <Icon name="whatsapp" size={16} />
            Get this quoted
          </a>
          <p className="mt-4 text-[11px] leading-relaxed text-dim">
            Every Riderzpro system is tuned by ear and by measurement before you collect the car, and
            re-tuned free once inside the first month.
          </p>
        </div>
      </aside>
    </div>
  );
}
