"use client";

import type { LeadKind } from "@/lib/leads/types";

/**
 * Saves a WhatsApp form's request in the database (POST /api/leads) so the team sees it in
 * /admin/leads even if the WhatsApp message is never sent. Call it right after opening WhatsApp
 * (the window must open first, inside the click, or browsers block it). Never throws.
 */
export function recordLead(
  kind: LeadKind,
  fields: { name?: string; phone?: string; email?: string; city?: string; details?: Record<string, string | number | boolean | null | undefined> },
  message: string,
) {
  try {
    const details = Object.fromEntries(
      Object.entries(fields.details ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, String(v)]),
    );
    void fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({ kind, name: fields.name, phone: fields.phone, email: fields.email, city: fields.city, details, message, page: location.pathname }),
    }).catch(() => {});
  } catch {
    /* saving the request must never stop WhatsApp opening */
  }
}
