"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { IFSC_RE } from "@/lib/vendor/validators";

/**
 * Shows the bank and branch for a typed IFSC, so a seller can spot a typo before saving.
 * Uses Razorpay's free public IFSC directory (no key, CORS open). Advisory only: a code the
 * directory doesn't know is flagged but never blocks saving (new branches can be missing),
 * and a network failure shows nothing.
 *
 * The account holder's NAME cannot come from here: that needs a paid bank-account
 * verification ("penny drop") on the server.
 */
type Branch = { bank: string; branch: string; city: string };
type Lookup = { ifsc: string; result: Branch | "not_found" };

const cache = new Map<string, Branch | "not_found">();

export function IfscBankHint({ ifsc, id }: { ifsc: string; id?: string }) {
  const code = ifsc.trim().toUpperCase();
  const valid = IFSC_RE.test(code);
  const [lookup, setLookup] = useState<Lookup | null>(null);

  useEffect(() => {
    if (!valid || cache.has(code)) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${code}`, { signal: ctrl.signal });
        if (res.status === 404) {
          cache.set(code, "not_found");
        } else if (res.ok) {
          const j = (await res.json()) as { BANK?: string; BRANCH?: string; CITY?: string };
          cache.set(code, { bank: j.BANK ?? "", branch: (j.BRANCH ?? "").replace(/\s+/g, " ").trim(), city: j.CITY ?? "" });
        } else return;
        setLookup({ ifsc: code, result: cache.get(code)! });
      } catch {
        // Offline or aborted: say nothing; the server still validates the format.
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [code, valid]);

  const result = valid ? (cache.get(code) ?? (lookup?.ifsc === code ? lookup.result : undefined)) : undefined;
  if (!result) return null;

  return (
    <p id={id} aria-live="polite" className="mt-1.5 text-xs leading-relaxed">
      {result === "not_found" ? (
        <span className="text-danger">We couldn&apos;t find this IFSC. Check it against your cheque book or passbook.</span>
      ) : (
        <span className="inline-flex items-start gap-1.5 text-ash">
          <CheckCircle2 size={13} className="mt-px shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="font-semibold text-chalk">{result.bank}</span>
            {result.branch && ` · ${result.branch}`}
            {result.city && `, ${result.city}`}
          </span>
        </span>
      )}
    </p>
  );
}
