/**
 * Browser-side helper for the vendor and admin JSON APIs.
 * Every route answers { ok: true, ... } or { ok: false, error, message, fields? }.
 */

export class ApiFailure extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function api<T = Record<string, unknown>>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; form?: FormData } = {},
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? (init.body !== undefined || init.form ? "POST" : "GET"),
    headers: init.form ? undefined : init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    credentials: "same-origin",
    cache: "no-store",
  });
  let data: { ok?: boolean; error?: string; message?: string; fields?: Record<string, string> } & Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new ApiFailure(res.status, "bad_response", "Something went wrong. Please try again.");
  }
  if (!res.ok || !data.ok) {
    throw new ApiFailure(res.status, data.error ?? "error", data.message ?? "Something went wrong. Please try again.", data.fields ?? {});
  }
  return data as T;
}

/** Upload one file; returns its id and URL. */
export async function uploadFile(kind: string, file: File): Promise<{ id: string; url: string; mime: string; size: number }> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);
  const res = await api<{ file: { id: string; url: string; mime: string; size: number } }>("/api/vendor/files", { form });
  return res.file;
}
