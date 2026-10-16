"use client";

/** Rendered on the client so dates show in the visitor's own time zone. */
export function VendorTimeline({ events }: { events: { at: string; label: string }[] }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return (
    <ol className="relative space-y-5 border-l border-tint/15 pl-6">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[1.85rem] top-1 h-3 w-3 rounded-full border-2 border-carbon ${i === events.length - 1 ? "bg-accent" : "bg-dim"}`}
          />
          <p className="text-sm font-semibold text-chalk">{e.label}</p>
          <time dateTime={e.at} suppressHydrationWarning className="text-xs text-dim">
            {fmt(e.at)}
          </time>
        </li>
      ))}
    </ol>
  );
}
