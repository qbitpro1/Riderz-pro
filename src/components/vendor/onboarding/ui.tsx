"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import type { VendorSelf } from "@/lib/vendor/types";
import type { OnboardingState } from "./types";

export type StepProps = {
  state: OnboardingState;
  /** False when the step is locked (changes were requested on other sections). */
  editable: boolean;
  onSaved: (vendor: VendorSelf) => void;
  onUploaded: (file: OnboardingState["uploaded"][number]) => void;
  refresh: () => Promise<OnboardingState | null>;
  goBack: () => void;
  goNext: () => void;
  goTo: (step: number) => void;
};

export function StepFrame({ title, intro, locked, children }: { title: string; intro?: string; locked?: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby="step-title" className="card p-5 sm:p-7">
      <h2 id="step-title" tabIndex={-1} className="display-3 outline-none">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ash">{intro}</p>}
      {locked && (
        <p className="mt-4 flex items-start gap-2 rounded-sm border border-tint/10 bg-tint/5 px-3 py-2.5 text-xs leading-relaxed text-ash">
          <Lock size={14} className="mt-px shrink-0 text-dim" aria-hidden="true" />
          The reviewer didn&apos;t flag this section, so it&apos;s read-only while you fix the others.
        </p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function StepFooter({
  onBack, showBack = true, busy, label, lockedLabel = "Next",
}: { onBack: () => void; showBack?: boolean; busy?: boolean; label?: string; lockedLabel?: string }) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-tint/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
      {showBack ? (
        <button type="button" onClick={onBack} disabled={busy} className="btn btn-outline">
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </button>
      ) : (
        <span />
      )}
      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? "Saving…" : (label ?? lockedLabel)}
        {!busy && <ArrowRight size={15} aria-hidden="true" />}
      </button>
    </div>
  );
}

export function SectionRule({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 mt-8 border-b border-tint/10 pb-2 font-display text-xs font-bold uppercase tracking-[0.18em] text-dim first:mt-0">{children}</h3>;
}

export function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
