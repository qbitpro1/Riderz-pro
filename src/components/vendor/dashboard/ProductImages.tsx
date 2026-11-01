"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, ImagePlus, Trash2 } from "lucide-react";
import { uploadFile } from "@/lib/vendor/client";
import { fileHref } from "@/lib/vendor/types";
import { failureMessage } from "./ui";

const MAX_IMAGES = 8;
const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Longest side of a photo after shrinking: plenty for the shop screen's full-size view. */
const MAX_SIDE = 2400;

/**
 * Phone camera photos are often over 3 MB, or HEIC: such a photo is redrawn as a JPEG of at most
 * MAX_SIDE pixels. Small JPG / PNG / WebP files go up untouched. Null when the browser can't read it.
 */
async function fitPhoto(file: File): Promise<File | null> {
  if (TYPES.includes(file.type) && file.size <= MAX_BYTES) return file;
  if (file.type && !file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff"; // transparent PNGs get a white background, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    for (const quality of [0.86, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", quality));
      if (blob && blob.size <= MAX_BYTES) return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
    }
    return null;
  } catch {
    return null;
  }
}

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
  const camera = useRef<HTMLInputElement>(null);
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
    for (const original of picked) {
      const file = await fitPhoto(original);
      if (!file) {
        issues.push(
          TYPES.includes(original.type)
            ? `${original.name}: couldn't make this photo small enough. Use one of 3 MB or less.`
            : `${original.name}: use a JPG, PNG or WebP image.`,
        );
        continue;
      }
      try {
        added.push((await uploadFile("product_image", file)).id);
      } catch (err) {
        issues.push(`${original.name}: ${failureMessage(err)}`);
      }
    }
    if (added.length) onChange([...value, ...added]);
    setProblem(issues.length ? issues.join(" ") : null);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (camera.current) camera.current.value = "";
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
          {/* Gallery or files (phones also offer the camera here); the camera button opens it straight away. */}
          <input ref={input} id="product-images-input" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} />
          <input ref={camera} id="product-images-camera" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => add(e.target.files)} />
          <div className="flex flex-wrap gap-2">
            <label htmlFor="product-images-camera" className={`btn btn-primary btn-sm cursor-pointer pointer-fine:hidden ${busy ? "pointer-events-none opacity-60" : ""}`}>
              <Camera size={16} aria-hidden />
              Take photo
            </label>
            <label htmlFor="product-images-input" className={`btn btn-outline btn-sm cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
              <ImagePlus size={16} aria-hidden />
              {busy ? "Uploading…" : value.length ? "Add more photos" : "Add photos"}
            </label>
          </div>
          <p className="mt-2 text-xs text-dim">
            JPG, PNG or WebP. Big phone photos are made smaller for you (3 MB limit). {value.length} of {MAX_IMAGES} added. The first photo is the cover.
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
