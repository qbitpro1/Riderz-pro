"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { ONBOARDING_STEPS, type VendorSelf } from "@/lib/vendor/types";
import { api } from "@/lib/vendor/client";
import { SignOutButton } from "../auth/SignOutButton";
import { StepAccount } from "./StepAccount";
import { StepBank } from "./StepBank";
import { StepDocuments } from "./StepDocuments";
import { StepShipping } from "./StepShipping";
import { StepStore } from "./StepStore";
import { StepTax } from "./StepTax";
import type { OnboardingState } from "./types";
import type { StepProps } from "./ui";

const STEP_VIEWS = [StepAccount, StepTax, StepStore, StepShipping, StepBank, StepDocuments] as const;

function firstIncomplete(completed: number[]) {
  return ONBOARDING_STEPS.find((s) => !completed.includes(s.step))?.step ?? ONBOARDING_STEPS.length;
}

export function OnboardingFlow({ initial }: { initial: OnboardingState }) {
  const [state, setState] = useState(initial);
  const { vendor } = state;
  const flagged = vendor.status === "changes_requested" ? (vendor.changesRequested?.sections ?? []) : null;

  const editableStep = useCallback(
    (step: number) => flagged === null || flagged.includes(ONBOARDING_STEPS[step - 1].id),
    [flagged],
  );

  const [step, setStep] = useState(() => {
    if (flagged) {
      const f = ONBOARDING_STEPS.find((s) => flagged.includes(s.id));
      if (f) return f.step;
    }
    return Math.min(Math.max(initial.vendor.currentStep, 1), ONBOARDING_STEPS.length);
  });

  // Keep the heading in focus when the step changes (not on first render).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById("step-title")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const refresh = useCallback(async () => {
    try {
      const next = await api<OnboardingState & { ok: true }>("/api/vendor/onboarding");
      const fresh: OnboardingState = { vendor: next.vendor, otp: next.otp, uploaded: next.uploaded, bank: next.bank };
      setState(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const onSaved = useCallback((v: VendorSelf) => {
    setState((s) => ({
      ...s,
      vendor: v,
      bank: v.onboarding.bank ? { ...v.onboarding.bank } : s.bank,
    }));
  }, []);

  const onUploaded = useCallback((file: OnboardingState["uploaded"][number]) => {
    setState((s) => ({ ...s, uploaded: [...s.uploaded.filter((u) => u.id !== file.id), file] }));
  }, []);

  const completed = vendor.completedSteps;
  const reach = firstIncomplete(completed);
  const canVisit = (n: number) => completed.includes(n) || n <= reach;
  const goTo = (n: number) => canVisit(n) && setStep(n);
  const View = STEP_VIEWS[step - 1];

  const props: StepProps = {
    state,
    editable: editableStep(step),
    onSaved,
    onUploaded,
    refresh,
    goBack: () => setStep((s) => Math.max(1, s - 1)),
    goNext: () => setStep((s) => Math.min(ONBOARDING_STEPS.length, s + 1)),
    goTo: (n) => setStep(n),
  };
  const meta = ONBOARDING_STEPS[step - 1];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Seller application</p>
          <h1 className="display-2">{vendor.status === "changes_requested" ? "Update your application" : "Set up your store"}</h1>
        </div>
        <SignOutButton label="Save & sign out" />
      </div>

      {flagged && (
        <div role="status" className="mb-6 rounded-sm border border-gold/40 bg-gold/10 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-chalk">
            <AlertTriangle size={16} className="text-gold" aria-hidden="true" /> Changes requested by our review team
          </p>
          {vendor.changesRequested?.note && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ash">{vendor.changesRequested.note}</p>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ash">
            Fix these sections, then resubmit:
            {flagged.map((id) => {
              const s = ONBOARDING_STEPS.find((x) => x.id === id);
              return s ? (
                <button key={id} type="button" onClick={() => setStep(s.step)} className="chip hover:text-chalk">
                  {s.title}
                </button>
              ) : null;
            })}
          </p>
        </div>
      )}

      {/* Desktop stepper */}
      <nav aria-label="Application steps" className="mb-6 hidden md:block">
        <ol className="grid grid-cols-6 gap-2">
          {ONBOARDING_STEPS.map((s) => {
            const done = completed.includes(s.step);
            const current = s.step === step;
            const visitable = canVisit(s.step);
            const locked = !editableStep(s.step);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!visitable}
                  aria-current={current ? "step" : undefined}
                  onClick={() => goTo(s.step)}
                  className={`flex w-full items-center gap-2.5 rounded-sm border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    current ? "border-accent bg-accent/10" : "border-tint/10 hover:border-tint/25"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      done ? "bg-accent text-on-accent" : current ? "border border-accent text-accent" : "border border-tint/20 text-dim"
                    }`}
                  >
                    {done ? <Check size={13} aria-hidden="true" /> : s.step}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-xs font-bold ${current ? "text-chalk" : "text-ash"}`}>{s.title}</span>
                    <span className="block text-[10px] text-dim">
                      {locked ? "Read-only" : done ? "Done" : current ? "In progress" : "To do"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile progress */}
      <div className="mb-5 md:hidden">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="font-bold text-accent">
            Step {step} of {ONBOARDING_STEPS.length}
          </span>
          <span className="font-semibold text-chalk">{meta.title}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Application progress"
          aria-valuemin={1}
          aria-valuemax={ONBOARDING_STEPS.length}
          aria-valuenow={step}
          className="h-1.5 overflow-hidden rounded-full bg-tint/10"
        >
          <div className="h-full bg-accent transition-all" style={{ width: `${(step / ONBOARDING_STEPS.length) * 100}%` }} />
        </div>
      </div>

      <View key={step} {...props} />
    </div>
  );
}
