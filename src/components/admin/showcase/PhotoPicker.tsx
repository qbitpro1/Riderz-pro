"use client";

import { useState } from "react";
import { ApiFailure } from "@/lib/vendor/client";

export type PickedPhoto = { id: string; url: string };

/** Upload and order photos for a car or a build. The first photo is the cover. */
export function PhotoPicker({ kind, photos, onChange, error }: { kind: "car_photo" | "build_photo"; photos: PickedPhoto[]; onChange: (p: PickedPhoto[]) => void; error?: string }) {
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setFail(null);
    const added: PickedPhoto[] = [];
    try {
      for (const f of Array.from(files).slice(0, 20 - photos.length)) {
        const form = new FormData();
        form.append("kind", kind);
        form.append("file", f);
        const res = await fetch("/api/admin/uploads", { method: "POST", body: form, credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new ApiFailure(res.status, data.error ?? "error", data.message ?? "Upload failed.");
        added.push({ id: data.file.id, url: data.file.url });
      }
    } catch (e) {
      setFail(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      onChange([...photos, ...added]);
      setBusy(false);
    }
  };

  const move = (i: number, by: number) => {
    const next = [...photos];
    const [p] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, p);
    onChange(next);
  };

  return (
    <div>
      <p className="label">Photos (first one is the cover)</p>
      <ul className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <li key={p.id} className="relative h-24 w-32 overflow-hidden border border-tint/15 bg-graphite">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a private upload */}
            <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 flex justify-between bg-void/80 px-1 text-[11px]">
              <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, -1)} className="px-1 disabled:opacity-30">◀</button>
              <button type="button" aria-label="Remove photo" onClick={() => onChange(photos.filter((x) => x.id !== p.id))} className="px-1 text-danger">✕</button>
              <button type="button" aria-label="Move right" disabled={i === photos.length - 1} onClick={() => move(i, 1)} className="px-1 disabled:opacity-30">▶</button>
            </span>
          </li>
        ))}
        <li>
          <label className={`grid h-24 w-32 cursor-pointer place-items-center border border-dashed border-tint/25 text-xs text-ash ${busy ? "opacity-50" : "hover:border-accent hover:text-accent"}`}>
            {busy ? "Uploading…" : "+ Add photos"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
          </label>
        </li>
      </ul>
      {(fail || error) && <p role="alert" className="mt-1 text-xs text-danger">{fail ?? error}</p>}
      <p className="mt-1 text-xs text-dim">JPG, PNG or WebP, up to 3 MB each. Photos are public only once this is live.</p>
    </div>
  );
}
