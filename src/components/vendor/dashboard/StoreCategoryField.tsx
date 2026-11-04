"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { STORE_CATEGORY_NAME_MAX, categoryTree, type StoreCategory } from "@/lib/vendor/store-categories";

/**
 * "Shop category" on the product form: where the product shows on the seller's Offline Store
 * screen. Pick one of the seller's own categories or sub-categories, or make a new one right here.
 */
export function StoreCategoryField({
  value,
  onChange,
  disabled,
  saving,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  /** Shown next to the label while an existing product's choice is being saved. */
  saving?: boolean;
}) {
  const [list, setList] = useState<StoreCategory[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    api<{ categories: StoreCategory[] }>("/api/vendor/store-categories")
      .then((r) => live && setList(r.categories))
      .catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, []);

  const tree = useMemo(() => categoryTree(list ?? []), [list]);

  async function create() {
    const n = name.trim();
    if (!n) return setError("Enter a name");
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ categories: StoreCategory[] }>("/api/vendor/store-categories", {
        body: { action: "create", name: n, parentId: parent || null },
      });
      setList(r.categories);
      const made = r.categories.find((c) => c.name.toLowerCase() === n.toLowerCase() && (c.parentId ?? "") === parent);
      if (made) onChange(made.id);
      setAdding(false);
      setName("");
      setParent("");
    } catch (err) {
      setError(err instanceof ApiFailure ? (err.fields.name ?? err.message) : "Couldn't add it. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="md:col-span-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="f-storeCategoryId" className="label">
          Shop category <span className="font-normal text-dim">(your Offline Store screen)</span>
        </label>
        {saving && <span className="text-xs text-dim">Saving…</span>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id="f-storeCategoryId"
          className="field sm:flex-1"
          value={value ?? ""}
          disabled={disabled || list === null}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">{list === null ? "Loading…" : "None (shows under its category above)"}</option>
          {tree.map((c) => [
            <option key={c.id} value={c.id}>
              {c.name}
            </option>,
            ...c.subs.map((s) => (
              <option key={s.id} value={s.id}>
                {`   ${c.name} › ${s.name}`}
              </option>
            )),
          ])}
        </select>
        {!disabled && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn btn-outline btn-sm shrink-0 self-start sm:self-auto">
            <Plus size={16} aria-hidden /> New category
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3 rounded-xl border border-tint/15 bg-carbon p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-chalk">New shop category</p>
            <button type="button" onClick={() => setAdding(false)} aria-label="Cancel new category" className="text-dim hover:text-chalk">
              <X size={18} aria-hidden />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="new-cat-name" className="label">
                Name
              </label>
              <input
                id="new-cat-name"
                className="field"
                value={name}
                maxLength={STORE_CATEGORY_NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void create();
                  }
                }}
                placeholder="e.g. Mats, or GFX Pro"
                autoComplete="off"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="new-cat-parent" className="label">
                Inside
              </label>
              <select id="new-cat-parent" className="field" value={parent} onChange={(e) => setParent(e.target.value)}>
                <option value="">Nothing (a main category)</option>
                {tree.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (sub-category)
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <button type="button" onClick={create} disabled={busy} className="btn btn-primary btn-sm mt-3">
            {busy ? "Adding…" : "Add and pick it"}
          </button>
        </div>
      )}
      <p className="mt-1.5 text-xs text-dim">
        Customers browse your shop screen by these. No review needed: on a saved product, a change here saves straight away.{" "}
        <Link href="/vendor/dashboard/store-screen/categories" className="underline underline-offset-2 hover:text-chalk">
          Manage categories
        </Link>
      </p>
    </div>
  );
}
