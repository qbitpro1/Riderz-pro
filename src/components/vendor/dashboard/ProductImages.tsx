"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { uploadFile } from "@/lib/vendor/client";
import { fileHref } from "@/lib/vendor/types";
import { failureMessage } from "./ui";

const MAX_IMAGES = 8;
const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

/** 1–8 product photos; the first is the cover. Uploads one by one with a client-side type and size check. */
export function ProductImages({ value, onChange, disabled, invalid, describedBy }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setProblem(null);
    const room = MAX_IMAGES - value.length;
    const picked = Array.from(files).slice(0, room);
    const issues: string[] = [];
    if (files.length > room) issues.push(`Only ${MAX_IMAGES} photos are allowed.`);
    setBusy(true);
    const added: string[] = [];
    for (const file of picked) {
      if (!TYPES.includes(file.type)) {
        issues.push(`${file.name}: use a JPG, PNG or WebP image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        issues.push(`${file.name}: images must be 3 MB or smaller.`);
        continue;
      }
      try {
        added.push((await uploadFile("product_image", file)).id);
      } catch (err) {
        issues.push(`${file.name}: ${failureMessage(err)}`);
      }
    }
    if (added.length) onChange([...value, ...added]);
    setProblem(issues.length ? issues.join(" ") : null);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  const move = (i: number, by: -1 | 1) => {
    const next = [...value];
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const small = "grid h-9 w-9 place-items-center rounded-[2px] border border-tint/10 bg-void text-ash hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30";

  return (
    <div
      id="f-images"
      tabIndex={-1}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={`space-y-3 rounded-[2px] border p-3 outline-none focus-visible:border-accent ${invalid ? "border-danger" : "border-tint/10"}`}
    >
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((id, i) => (
            <li key={id} className="space-y-1.5">
              <div className="relative aspect-square overflow-hidden rounded-[2px] border border-tint/10 bg-steel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileHref(id)} alt={`Product photo ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-on-accent">Cover</span>
                )}
              </div>
              {!disabled && (
                <div className="flex items-center justify-between gap-1">
                  <button type="button" className={small} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>
                    <ArrowLeft size={14} aria-hidden />
                  </button>
                  <button type="button" className={small} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move photo ${i + 1} later`}>
                    <ArrowRight size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`${small} hover:!border-danger hover:!text-danger`}
                    onClick={() => onChange(value.filter((x) => x !== id))}
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && value.length < MAX_IMAGES && (
        <div>
          <input
            ref={input}
            id="product-images-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => add(e.target.files)}
          />
          <label htmlFor="product-images-input" className={`btn btn-outline btn-sm cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <ImagePlus size={16} aria-hidden />
            {busy ? "Uploading…" : value.length ? "Add more photos" : "Add photos"}
          </label>
          <p className="mt-2 text-xs text-dim">
            JPG, PNG or WebP, up to 3 MB each. {value.length} of {MAX_IMAGES} added. The first photo is the cover.
          </p>
        </div>
      )}
      {problem && (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
    </div>
  );
}
