"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { BUILD_TAGS, type Build } from "@/lib/data/community";
import { PhotoPicker, type PickedPhoto } from "./PhotoPicker";
import { fromGroups, toGroups, toLines } from "./lines";

const STATUS_TEXT: Record<Build["status"], string> = { draft: "Draft (not on the site)", live: "Live", archived: "Archived (off the site)" };

/** Add or edit a finished customer build for the showcase. */
export function BuildForm({ build }: { build: Build | null }) {
  const router = useRouter();
  const [f, setF] = useState({
    status: build?.status ?? "draft",
    title: build?.title ?? "",
    vehicle: build?.vehicle ?? "",
    owner: build?.owner ?? "",
    city: build?.city ?? "",
    cost: build?.cost === null || build?.cost === undefined ? "" : String(build.cost),
    weeks: build?.weeks === null || build?.weeks === undefined ? "" : String(build.weeks),
    brief: build?.brief ?? "",
    tag: build?.tag ?? "Street",
    mods: fromGroups(build?.mods ?? []),
    shop: (build?.shop ?? []).join("\n"),
  });
  const [photos, setPhotos] = useState<PickedPhoto[]>(build ? build.photoIds.map((id, i) => ({ id, url: build.photos[i] })) : []);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    setErrors({});
    setMsg(null);
    const body = {
      ...f,
      cost: f.cost.trim() === "" ? null : Number(f.cost),
      weeks: f.weeks.trim() === "" ? null : Number(f.weeks),
      mods: toGroups(f.mods),
      shop: toLines(f.shop),
      photoIds: photos.map((p) => p.id),
    };
    try {
      const r = await api<{ build: { id: string } }>(build ? `/api/admin/builds/${build.id}` : "/api/admin/builds", { method: build ? "PUT" : "POST", body });
      setMsg("Saved.");
      router.push(`/admin/builds?edit=${r.build.id}`);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiFailure) {
        setErrors(e.fields);
        setMsg(e.message);
      } else setMsg("Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const input = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label className="label" htmlFor={`b-${k}`}>{label}</label>
      <input id={`b-${k}`} className="field" value={String(f[k])} onChange={set(k)} {...props} />
      {errors[k] && <p className="mt-1 text-xs text-danger">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-display text-lg font-extrabold uppercase">{build ? `Edit ${build.title}` : "Add a build"}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="b-status">Status</label>
          <select id="b-status" className="field" value={f.status} onChange={set("status")}>
            {(["draft", "live", "archived"] as const).map((s) => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}
          </select>
        </div>
        {input("title", "Title", { placeholder: "Project Dust" })}
        {input("vehicle", "Vehicle", { placeholder: "2022 Mahindra Thar LX 4x4" })}
        <div>
          <label className="label" htmlFor="b-tag">Type</label>
          <select id="b-tag" className="field" value={f.tag} onChange={set("tag")}>
            {BUILD_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {input("owner", "Owner (as they agreed to be named, optional)")}
        {input("city", "City (optional)")}
        {input("cost", "Build cost ₹ (optional)", { inputMode: "numeric" })}
        {input("weeks", "Weeks in the shop (optional)", { inputMode: "numeric" })}
      </div>
      <div>
        <label className="label" htmlFor="b-brief">The story</label>
        <textarea id="b-brief" className="field min-h-20 py-2" value={f.brief} onChange={set("brief")} maxLength={800} />
        {errors.brief && <p className="mt-1 text-xs text-danger">{errors.brief}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="b-mods">Work done (one group per line, &quot;Group: item, item&quot;)</label>
          <textarea id="b-mods" className="field min-h-24 py-2" value={f.mods} onChange={set("mods")} placeholder={"Suspension: 2-inch lift, Bilstein shocks\nLighting: LED light bar"} />
        </div>
        <div>
          <label className="label" htmlFor="b-shop">Products used (one product slug per line, optional)</label>
          <textarea id="b-shop" className="field min-h-24 py-2" value={f.shop} onChange={set("shop")} placeholder="riderzpro-9d-floor-mats" />
        </div>
      </div>
      <PhotoPicker kind="build_photo" photos={photos} onChange={setPhotos} error={errors.photoIds} />
      {msg && <p role="status" className={`text-sm ${Object.keys(errors).length ? "text-danger" : "text-accent"}`}>{msg}</p>}
      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? "Saving…" : build ? "Save changes" : "Add build"}</button>
    </div>
  );
}
