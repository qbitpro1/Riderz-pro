"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { rupees, number as fmtNumber } from "@/lib/format";

type Report = {
  fileName: string;
  format: string;
  totals: { uploaded: number; accepted: number; duplicate: number; rejected: number; warnings: number };
  breakdown: { code: string; label: string; count: number; blocking: boolean }[];
  parserWarnings: string[];
  rows: {
    rowNumber: number;
    accepted: boolean;
    errors: string[];
    warnings: string[];
    quality: { total: number };
    vehicle: {
      make: string | null;
      model: string | null;
      variant: string | null;
      year: number | null;
      fuel: string | null;
      transmission: string | null;
      km: number | null;
      price: number | null;
      city: string | null;
      images: string[];
      inferences: string[];
    };
  }[];
};

export function InventoryUploader() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showRows, setShowRows] = useState<"all" | "rejected">("rejected");
  const inputRef = useRef<HTMLInputElement>(null);

  async function send(promise: Promise<Response>) {
    setBusy(true);
    setError(null);
    try {
      const res = await promise;
      const json = await res.json();
      if (!json.ok) throw new Error(json.message ?? "Upload failed.");
      setReport(json.report as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setReport(null);
    } finally {
      setBusy(false);
    }
  }

  function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    void send(fetch("/api/dealer/inventory/upload", { method: "POST", body: form }));
  }

  function syncSheet() {
    if (!sheetUrl.trim()) return;
    void send(
      fetch("/api/dealer/inventory/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sheetUrl }),
      }),
    );
  }

  return (
    <div>
      {/* file drop ------------------------------------------------- */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={`card flex flex-col items-center justify-center gap-3 p-10 text-center transition-colors ${
          dragging ? "border-accent bg-accent/6" : ""
        }`}
      >
        <Icon name="bag" size={28} className="text-accent" />
        <p className="font-display text-lg font-extrabold uppercase">Drop your stock list here</p>
        <p className="max-w-md text-sm text-ash">
          CSV, Excel, XML or JSON — whatever your DMS or spreadsheet already exports. We match your
          column names automatically, so there is no template to fill in.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls,.xml,.json,text/csv,application/json,text/xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn btn-primary btn-sm mt-2">
          {busy ? "Checking…" : "Choose a file"}
        </button>
        <p className="text-[11px] text-dim">Up to 5,000 vehicles per file · 12 MB max</p>
      </div>

      {/* google sheet ---------------------------------------------- */}
      <div className="card mt-4 p-5">
        <p className="font-display text-sm font-extrabold uppercase">Or connect a Google Sheet</p>
        <p className="mt-1 text-xs text-ash">
          Keep your stock in a sheet and we sync it. Change a row to SOLD and the car comes off the
          site on the next sync.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="field flex-1"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            aria-label="Google Sheet URL"
          />
          <button type="button" onClick={syncSheet} disabled={busy || !sheetUrl.trim()} className="btn btn-outline btn-sm sm:w-auto">
            Check sheet
          </button>
        </div>
        <p className="mt-2 text-[11px] text-dim">
          Share → Anyone with the link → Viewer. We only ever read it.
        </p>
      </div>

      {error && (
        <div className="card mt-4 border-danger/40 bg-danger/6 p-4">
          <p className="flex items-center gap-2 text-sm text-danger">
            <Icon name="close" size={15} />
            {error}
          </p>
        </div>
      )}

      {/* report ---------------------------------------------------- */}
      {report && (
        <div className="mt-6">
          <div className="card p-5">
            <p className="eyebrow mb-1">Validation report</p>
            <p className="text-xs text-dim">
              {report.fileName} · {report.format.toUpperCase()}
            </p>

            <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              <Tally value={report.totals.uploaded} label="Vehicles uploaded" />
              <Tally value={report.totals.accepted} label="Accepted" tone="accent" />
              <Tally value={report.totals.duplicate} label="Duplicate" tone="gold" />
              <Tally value={report.totals.rejected} label="Rejected" tone={report.totals.rejected ? "danger" : "neutral"} />
              <Tally value={report.totals.warnings} label="With warnings" tone="gold" />
            </ul>

            {report.parserWarnings.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-white/8 pt-4">
                {report.parserWarnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-xs text-gold">
                    <Icon name="shield" size={13} className="mt-0.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}

            {report.breakdown.length > 0 && (
              <div className="mt-5 border-t border-white/8 pt-4">
                <p className="label">What needs attention</p>
                <ul className="flex flex-wrap gap-2">
                  {report.breakdown.map((b) => (
                    <li
                      key={b.code}
                      className={`chip ${b.blocking ? "border-danger/40 text-danger" : "border-gold/40 text-gold"}`}
                    >
                      {b.label}
                      <span className="tnum opacity-70">{b.count}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-dim">
                  Red stops a car going live. Amber does not — it just means the listing will be
                  thinner than it could be, and will rank lower.
                </p>
              </div>
            )}
          </div>

          {/* rows -------------------------------------------------- */}
          <div className="mt-4 flex items-center gap-3">
            <p className="text-xs text-ash">
              Showing {showRows === "rejected" ? "problem rows" : "all rows"}
            </p>
            <button
              type="button"
              onClick={() => setShowRows(showRows === "rejected" ? "all" : "rejected")}
              className="btn btn-outline btn-sm ml-auto"
            >
              {showRows === "rejected" ? "Show all rows" : "Show problems only"}
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                  <th className="p-2.5">Row</th>
                  <th className="p-2.5">Vehicle as we read it</th>
                  <th className="p-2.5 text-right">Price</th>
                  <th className="p-2.5 text-right">KM</th>
                  <th className="p-2.5 text-center">Photos</th>
                  <th className="p-2.5 text-center">Quality</th>
                  <th className="p-2.5">Result</th>
                </tr>
              </thead>
              <tbody>
                {report.rows
                  .filter((r) => (showRows === "all" ? true : !r.accepted || r.warnings.length > 0))
                  .slice(0, 200)
                  .map((r) => (
                    <tr key={r.rowNumber} className="border-b border-white/8 align-top">
                      <td className="p-2.5 text-xs text-dim tnum">{r.rowNumber}</td>
                      <td className="p-2.5 text-xs">
                        <span className="block">
                          {[r.vehicle.year, r.vehicle.make, r.vehicle.model, r.vehicle.variant].filter(Boolean).join(" ") ||
                            "— could not read —"}
                        </span>
                        <span className="block text-dim">
                          {[r.vehicle.fuel, r.vehicle.transmission, r.vehicle.city].filter(Boolean).join(" · ")}
                        </span>
                        {r.vehicle.inferences.map((inf) => (
                          <span key={inf} className="mt-0.5 block text-[10px] text-accent/70">
                            {inf}
                          </span>
                        ))}
                      </td>
                      <td className="p-2.5 text-right text-xs tnum">{r.vehicle.price ? rupees(r.vehicle.price) : "—"}</td>
                      <td className="p-2.5 text-right text-xs tnum">{r.vehicle.km != null ? fmtNumber(r.vehicle.km) : "—"}</td>
                      <td className="p-2.5 text-center text-xs tnum">{r.vehicle.images.length}</td>
                      <td className="p-2.5 text-center text-xs tnum">
                        <span className={r.quality.total >= 70 ? "text-accent" : r.quality.total >= 45 ? "text-ash" : "text-gold"}>
                          {r.quality.total}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {r.accepted ? (
                          <span className="chip border-accent/35 text-accent">Accepted</span>
                        ) : (
                          <span className="chip border-danger/40 text-danger">Rejected</span>
                        )}
                        <span className="mt-1 flex flex-wrap gap-1">
                          {[...r.errors, ...r.warnings].slice(0, 4).map((code) => (
                            <span key={code} className="text-[10px] text-dim">
                              {code.replace(/_/g, " ").toLowerCase()}
                            </span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="card mt-4 flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
            <p className="text-sm text-ash">
              This is a dry run — nothing is live yet. Register as a partner and we will publish the{" "}
              <span className="text-chalk tnum">{report.totals.accepted}</span> accepted vehicles.
            </p>
            <a href="#register" className="btn btn-accent btn-sm">
              Register and publish
              <Icon name="arrow" size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Tally({ value, label, tone = "neutral" }: { value: number; label: string; tone?: "neutral" | "accent" | "gold" | "danger" }) {
  const colour =
    tone === "accent" ? "text-accent" : tone === "gold" ? "text-gold" : tone === "danger" ? "text-danger" : "text-chalk";
  return (
    <li className="border border-white/8 bg-white/2 p-3">
      <p className={`font-display text-2xl font-extrabold tnum ${colour}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-dim">{label}</p>
    </li>
  );
}
