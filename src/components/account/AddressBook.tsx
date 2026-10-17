"use client";

import { useState } from "react";
import { ApiFailure, api } from "@/lib/vendor/client";
import { ADDRESS_MAX, type AddressView } from "@/lib/account/types";
import type { AddressInput } from "@/lib/account/schemas";
import { Notice, type FieldErrors } from "@/components/vendor/auth/fields";
import { AddressForm, emptyAddress, toValues } from "./AddressForm";

/** Saved addresses: add, edit, delete, choose the default. Used at checkout. */
export function AddressBook({ initial, name, mobile }: { initial: AddressView[]; name: string; mobile: string }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(initial.length === 0 ? "new" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  async function reload() {
    setList((await api<{ addresses: AddressView[] }>("/api/account/addresses")).addresses);
  }

  async function save(input: AddressInput, id?: string) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      if (id) await api(`/api/account/addresses/${id}`, { method: "PUT", body: input });
      else await api("/api/account/addresses", { body: input });
      await reload();
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiFailure) setFields(err.fields);
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: AddressView) {
    if (!window.confirm(`Delete the address "${a.label}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/account/addresses/${a.id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}

      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((a) =>
          editing === a.id ? (
            <li key={a.id} className="card p-4 md:col-span-2">
              <AddressForm initial={toValues(a)} submitLabel="Save address" onSave={(i) => save(i, a.id)} onCancel={() => setEditing(null)} serverErrors={fields} busy={busy} />
            </li>
          ) : (
            <li key={a.id} className="card flex flex-col p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-chalk">{a.label}</p>
                {a.isDefault && <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 text-[11px] font-bold text-accent">Default</span>}
              </div>
              <p className="mt-2 text-sm text-ash">
                {a.name} · <span className="tnum">+91 {a.mobile}</span>
                <br />
                {a.address}
                <br />
                {a.city}, {a.state} {a.pincode}
              </p>
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm">
                <button type="button" className="font-semibold text-accent" onClick={() => setEditing(a.id)} disabled={busy}>
                  Edit
                </button>
                {!a.isDefault && (
                  <button type="button" className="text-ash hover:text-chalk" onClick={() => save({ ...toValues(a), isDefault: true } as AddressInput, a.id)} disabled={busy}>
                    Make default
                  </button>
                )}
                <button type="button" className="text-ash hover:text-danger" onClick={() => remove(a)} disabled={busy}>
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <div className="card p-4">
          <p className="mb-3 text-sm font-bold text-chalk">New address</p>
          <AddressForm
            initial={emptyAddress(name, mobile)}
            submitLabel="Save address"
            onSave={(i) => save(i)}
            onCancel={list.length ? () => setEditing(null) : undefined}
            serverErrors={fields}
            busy={busy}
          />
        </div>
      ) : (
        list.length < ADDRESS_MAX && (
          <button type="button" className="btn btn-outline" onClick={() => setEditing("new")}>
            Add an address
          </button>
        )
      )}
    </div>
  );
}
