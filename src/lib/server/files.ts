import "server-only";

import { sql, sqlOne } from "@/lib/db/client";
import { ApiError } from "./http";
import { newId } from "./security";

/**
 * UPLOADED FILES
 *
 * KYC documents, store logos/banners and product photos, stored in the
 * database (bytea) so there is no second service to run. The type is decided
 * from the file's first bytes, never from its name or the browser's claim.
 *
 * Who may read a file (enforced in the two download routes):
 *   documents (doc_*)               the owning vendor, and admins via /api/admin/files/[id]
 *   logo, banner, product_image     anyone, once the owning vendor is approved;
 *                                   before that only the owner and admins
 */

export type FileKind =
  | "doc_pan"
  | "doc_gst"
  | "doc_cheque"
  | "doc_trade_license"
  | "doc_brand_auth"
  | "logo"
  | "banner"
  | "product_image";

export const FILE_KINDS: FileKind[] = [
  "doc_pan",
  "doc_gst",
  "doc_cheque",
  "doc_trade_license",
  "doc_brand_auth",
  "logo",
  "banner",
  "product_image",
];

export const isDocument = (kind: FileKind) => kind.startsWith("doc_");

const MB = 1024 * 1024;
const LIMITS: Record<"document" | "image", { bytes: number; types: string[] }> = {
  document: { bytes: 5 * MB, types: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
  image: { bytes: 3 * MB, types: ["image/jpeg", "image/png", "image/webp"] },
};

/** Per-vendor caps, so one account cannot fill the database. */
const MAX_FILES_PER_VENDOR = 600;

function sniff(b: Uint8Array): string | null {
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";
  return null;
}

export async function saveFile(vendorId: string, kind: FileKind, file: File): Promise<{ id: string; mime: string; size: number }> {
  const limit = LIMITS[isDocument(kind) ? "document" : "image"];
  if (file.size === 0) throw new ApiError(400, "empty_file", "That file is empty.");
  if (file.size > limit.bytes) {
    throw new ApiError(413, "file_too_large", `Files must be under ${limit.bytes / MB} MB.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime || !limit.types.includes(mime)) {
    throw new ApiError(
      415,
      "file_type",
      isDocument(kind) ? "Upload a PDF, JPG, PNG or WebP file." : "Upload a JPG, PNG or WebP image.",
    );
  }
  const count = await sqlOne<{ n: string }>("SELECT count(*) AS n FROM files WHERE vendor_id = $1", [vendorId]);
  if (Number(count?.n ?? 0) >= MAX_FILES_PER_VENDOR) {
    throw new ApiError(429, "too_many_files", "You have reached the upload limit. Remove unused photos first.");
  }
  const id = newId("fil");
  await sql("INSERT INTO files (id, vendor_id, kind, mime, size_bytes, data) VALUES ($1, $2, $3, $4, $5, $6)", [
    id,
    vendorId,
    kind,
    mime,
    bytes.length,
    Buffer.from(bytes),
  ]);
  return { id, mime, size: bytes.length };
}

export type StoredFile = { id: string; vendor_id: string | null; kind: FileKind; mime: string; data: Buffer; vendor_status: string | null };

export async function loadFile(id: string): Promise<StoredFile | null> {
  if (!/^fil_[A-Za-z0-9_-]{10,40}$/.test(id)) return null;
  return sqlOne<StoredFile>(
    `SELECT f.id, f.vendor_id, f.kind, f.mime, f.data, v.status AS vendor_status
     FROM files f LEFT JOIN vendors v ON v.id = f.vendor_id WHERE f.id = $1`,
    [id],
  );
}

/** Verify that every id belongs to this vendor and is of an allowed kind. */
export async function assertOwnFiles(vendorId: string, ids: string[], kinds: FileKind[]): Promise<void> {
  if (ids.length === 0) return;
  const rows = await sql<{ id: string }>(
    "SELECT id FROM files WHERE vendor_id = $1 AND id = ANY($2::text[]) AND kind = ANY($3::text[])",
    [vendorId, ids, kinds],
  );
  if (rows.length !== new Set(ids).size) throw new ApiError(400, "bad_file", "One of the files could not be found. Upload it again.");
}

export function fileResponse(f: StoredFile, cache: "public" | "private"): Response {
  const body = new Uint8Array(f.data);
  return new Response(body, {
    headers: {
      "Content-Type": f.mime,
      "Content-Length": String(body.length),
      "X-Content-Type-Options": "nosniff",
      // Documents open inline but can never run script.
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": cache === "public" ? "public, max-age=86400, immutable" : "private, no-store",
    },
  });
}
