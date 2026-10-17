"use client";

import { useState } from "react";

/** Copies a coupon code, to paste at checkout. */
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard blocked: the code is on screen anyway */
        }
      }}
      aria-label={`Copy code ${code}`}
    >
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}
