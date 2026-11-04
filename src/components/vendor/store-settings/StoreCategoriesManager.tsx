"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Check, CornerDownRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { STORE_CATEGORY_NAME_MAX, STORE_SUGGEST_MAX, categoryTree, suggestedCategoryIds, type StoreCategory, type StoreCategoryTree } from "@/lib/vendor/store-categories";

type Action =
  | { action: "create"; name: string; parentId: string | null }
  | { action: "rename"; id: string; name: string }
  | { action: "move"; id: string; dir: "up" | "down" }
  | { action: "delete"; id: string }
  | { action: "bestseller"; id: string; on: boolean }
  | { action: "suggest"; id: string; ids: string[] };

/**
 * The seller's own shop categories for the Offline Store screen: add main categories and
 * sub-categories inside them, rename, reorder and delete. Each one links straight to
 * "Add a product" with that category already picked.
 */
export function StoreCategoriesManager({ initial, canEdit }: { initial: StoreCategory[]; canEdit: boolean }) {
  const [list, setList] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [addingSub, setAddingSub] = useState<string | null>(null);
  const tree = useMemo(() => categoryTree(list), [list]);

  async function run(a: Action, done?: string): Promise<boolean> {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ categories: StoreCategory[] }>("/api/vendor/store-categories", { body: a });
      setList(r.categories);
      if (done) setMsg({ ok: true, text: done });
      return true;
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiFailure ? (err.fields.name ?? err.message) : "Couldn't save. Please try again." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function remove(c: StoreCategory & { subs?: StoreCategory[] }) {
    const inside = c.products + (c.subs ?? []).reduce((t, s) => t + s.products, 0);
    const what = c.subs?.length ? ` and its ${c.subs.length} sub-categor${c.subs.length === 1 ? "y" : "ies"}` : "";
    const note = inside ? ` ${inside} product${inside === 1 ? "" : "s"} in it will stay listed, just without a shop category.` : "";
    if (window.confirm(`Delete "${c.name}"${what}?${note}`)) void run({ action: "delete", id: c.id }, `Deleted "${c.name}".`);
  }

  return (
    <div className="mt-6 max-w-2xl space-y-6">
      {canEdit && <NameForm label="New main category" placeholder="e.g. Seat Cover" busy={busy} onSave={(name) => run({ action: "create", name, parentId: null }, `Added "${name}".`)} />}

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-ash" : "text-danger"}`}>
          {msg.text}
        </p>
      )}

      {tree.length === 0 ? (
        <p className="rounded-sm border border-dashed border-tint/20 p-6 text-sm text-ash">
          No shop categories yet. Add your first one above, like Seat Cover or Mats. Until then your shop screen groups products by their Riderzpro category.
        </p>
      ) : (
        <ol className="divide-y divide-tint/10 rounded-sm border border-tint/15">
          {tree.map((c, i) => (
            <li key={c.id} className="p-4">
              <Row
                c={c}
                canEdit={canEdit}
                busy={busy}
                first={i === 0}
                last={i === tree.length - 1}
                editing={editing === c.id}
                onEdit={() => setEditing(c.id)}
                onCancel={() => setEditing(null)}
                onRename={async (name) => (await run({ action: "rename", id: c.id, name }, "Renamed.")) && setEditing(null)}
                onMove={(dir) => run({ action: "move", id: c.id, dir })}
                onDelete={() => remove(c)}
              />
              <Extras c={c} tree={tree} canEdit={canEdit} busy={busy} run={run} />
              {(c.subs.length > 0 || addingSub === c.id) && (
                <ol className="mt-3 space-y-2 border-l-2 border-tint/10 pl-4">
                  {c.subs.map((s, j) => (
                    <li key={s.id}>
                      <Row
                        c={s}
                        sub
                        canEdit={canEdit}
                        busy={busy}
                        first={j === 0}
                        last={j === c.subs.length - 1}
                        editing={editing === s.id}
                        onEdit={() => setEditing(s.id)}
                        onCancel={() => setEditing(null)}
                        onRename={async (name) => (await run({ action: "rename", id: s.id, name }, "Renamed.")) && setEditing(null)}
                        onMove={(dir) => run({ action: "move", id: s.id, dir })}
                        onDelete={() => remove(s)}
                      />
                    </li>
                  ))}
                  {addingSub === c.id && (
                    <li>
                      <NameForm
                        label={`New sub-category in ${c.name}`}
                        placeholder="e.g. Autoform"
                        busy={busy}
                        autoFocus
                        onCancel={() => setAddingSub(null)}
                        onSave={async (name) => (await run({ action: "create", name, parentId: c.id }, `Added "${name}" in ${c.name}.`)) && setAddingSub(null)}
                      />
                    </li>
                  )}
                </ol>
              )}
              {canEdit && addingSub !== c.id && (
                <button type="button" onClick={() => setAddingSub(c.id)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                  <Plus size={15} aria-hidden /> Add sub-category
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Row({
  c,
  sub = false,
  canEdit,
  busy,
  first,
  last,
  editing,
  onEdit,
  onCancel,
  onRename,
  onMove,
  onDelete,
}: {
  c: StoreCategory;
  sub?: boolean;
  canEdit: boolean;
  busy: boolean;
  first: boolean;
  last: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onRename: (name: string) => void;
  onMove: (dir: "up" | "down") => void;
  onDelete: () => void;
}) {
  if (editing) return <NameForm label={`Rename ${c.name}`} initial={c.name} busy={busy} autoFocus onCancel={onCancel} onSave={onRename} />;
  const icon = "grid h-9 w-9 place-items-center rounded-sm text-ash hover:bg-steel hover:text-chalk disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex min-w-44 flex-1 items-center gap-2">
        {sub && <CornerDownRight size={15} aria-hidden className="shrink-0 text-dim" />}
        <span className={`truncate ${sub ? "text-sm" : "text-base"} font-semibold text-chalk`}>{c.name}</span>
        <span className="shrink-0 text-xs text-dim tnum">
          {c.products} product{c.products === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Link href={`/vendor/dashboard/products/new?shopCategory=${encodeURIComponent(c.id)}`} className="btn btn-outline btn-sm">
          <Plus size={14} aria-hidden /> Add product
        </Link>
        {canEdit && (
          <>
            <button type="button" className={icon} disabled={busy || first} onClick={() => onMove("up")} aria-label={`Move ${c.name} up`}>
              <ArrowUp size={16} aria-hidden />
            </button>
            <button type="button" className={icon} disabled={busy || last} onClick={() => onMove("down")} aria-label={`Move ${c.name} down`}>
              <ArrowDown size={16} aria-hidden />
            </button>
            <button type="button" className={icon} disabled={busy} onClick={onEdit} aria-label={`Rename ${c.name}`}>
              <Pencil size={16} aria-hidden />
            </button>
            <button type="button" className={`${icon} hover:text-danger`} disabled={busy} onClick={onDelete} aria-label={`Delete ${c.name}`}>
              <Trash2 size={16} aria-hidden />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NameForm({
  label,
  placeholder,
  initial = "",
  busy,
  autoFocus,
  onSave,
  onCancel,
}: {
  label: string;
  placeholder?: string;
  initial?: string;
  busy: boolean;
  autoFocus?: boolean;
  onSave: (name: string) => unknown;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const r = await onSave(n);
    if (r !== false && !initial) setName("");
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="min-w-48 flex-1">
        <span className="label">{label}</span>
        <input
          className="field"
          value={name}
          maxLength={STORE_CATEGORY_NAME_MAX}
          placeholder={placeholder}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          autoFocus={autoFocus}
        />
      </label>
      <button type="submit" disabled={busy || !name.trim()} className="btn btn-primary btn-sm h-11">
        {initial ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />} {initial ? "Save" : "Add"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="btn btn-outline btn-sm h-11" aria-label="Cancel">
          <X size={16} aria-hidden />
        </button>
      )}
    </form>
  );
}

/** Under a main category: the Bestseller switch and which categories to suggest alongside it. */
function Extras({
  c,
  tree,
  canEdit,
  busy,
  run,
}: {
  c: StoreCategoryTree;
  tree: StoreCategoryTree[];
  canEdit: boolean;
  busy: boolean;
  run: (a: Action, done?: string) => Promise<boolean>;
}) {
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState<string[]>(c.suggestIds);
  const now = suggestedCategoryIds(c, tree);
  const names = (ids: string[]) => ids.map((id) => tree.find((t) => t.id === id)?.name).filter(Boolean).join(", ");
  const others = tree.filter((t) => t.id !== c.id);

  return (
    <div className="mt-3 space-y-2 text-sm">
      <label className={`inline-flex items-center gap-2 ${canEdit ? "cursor-pointer" : "opacity-60"}`}>
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--accent)]"
          checked={c.bestseller}
          disabled={!canEdit || busy}
          onChange={(e) => run({ action: "bestseller", id: c.id, on: e.target.checked }, e.target.checked ? `"${c.name}" is tagged Bestseller.` : `Bestseller tag removed from "${c.name}".`)}
        />
        <span className="font-semibold text-chalk">★ Bestseller</span>
        <span className="text-dim">tag on every product in it</span>
      </label>

      {!picking ? (
        <p className="text-ash">
          <span className="text-dim">Suggests:</span> {now.length ? names(now) : "nothing yet"}
          {now.length > 0 && c.suggestIds.length === 0 && <span className="text-dim"> (automatic)</span>}
          {canEdit && others.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPick(c.suggestIds.length ? c.suggestIds : now);
                setPicking(true);
              }}
              className="ml-2 font-semibold text-accent hover:underline"
            >
              Change
            </button>
          )}
        </p>
      ) : (
        <div className="rounded-sm border border-tint/15 p-3">
          <p className="text-ash">
            When a customer adds something from <strong className="text-chalk">{c.name}</strong>, suggest products from (up to {STORE_SUGGEST_MAX}):
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {others.map((o) => {
              const on = pick.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && pick.length >= STORE_SUGGEST_MAX}
                  onClick={() => setPick((p) => (on ? p.filter((x) => x !== o.id) : [...p, o.id]))}
                  className={`min-h-9 rounded-full border px-3 text-sm font-semibold transition-colors disabled:opacity-40 ${
                    on ? "border-accent bg-accent text-on-accent" : "border-tint/15 text-ash hover:text-chalk"
                  }`}
                >
                  {o.name}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className="btn btn-primary btn-sm"
              onClick={async () => (await run({ action: "suggest", id: c.id, ids: pick }, "Suggestions saved.")) && setPicking(false)}
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn btn-outline btn-sm"
              onClick={async () => (await run({ action: "suggest", id: c.id, ids: [] }, "Back to automatic suggestions.")) && setPicking(false)}
            >
              Use automatic
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPicking(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
