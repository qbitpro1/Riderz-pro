import "server-only";

import { z } from "zod";
import { sql, sqlOne } from "@/lib/db/client";
import { BUILD_TAGS, type Build } from "@/lib/data/community";
import { fileHref } from "@/lib/vendor/types";
import { slugify } from "@/lib/vendor/validators";
import { ApiError } from "./http";
import { newId } from "./security";
import { audit } from "./vendors";
import { assertPhotos } from "./cars";

/**
 * THE BUILD SHOWCASE (builds)
 *
 * Real customer builds the team adds in /admin/builds, with their own photos. Only live builds
 * show on the site (/builds, the build configurator, off-road). An empty table shows no builds.
 */

type Row = {
  id: string; slug: string; status: Build["status"]; title: string; vehicle: string; owner: string | null; city: string | null;
  cost: number | null; weeks: number | null; brief: string; tag: Build["tag"]; mods: Build["mods"]; shop: string[]; photos: string[];
};

const toBuild = (r: Row, admin = false): Build => ({
  id: r.id,
  slug: r.slug,
  status: r.status,
  title: r.title,
  vehicle: r.vehicle,
  owner: r.owner,
  city: r.city,
  cost: r.cost,
  weeks: r.weeks,
  brief: r.brief,
  tag: r.tag,
  mods: r.mods,
  shop: r.shop,
  photos: r.photos.map((id) => (admin ? `/api/admin/files/${id}` : fileHref(id))),
  photoIds: r.photos,
});

/** Live builds, newest first. Empty without a database. */
export async function liveBuilds(): Promise<Build[]> {
  try {
    return (await sql<Row>("SELECT * FROM builds WHERE status = 'live' ORDER BY created_at DESC")).map((r) => toBuild(r));
  } catch {
    return [];
  }
}

export async function liveBuild(slug: string): Promise<Build | null> {
  const r = await sqlOne<Row>("SELECT * FROM builds WHERE slug = $1 AND status = 'live'", [slug]);
  return r ? toBuild(r) : null;
}

export async function listBuildsAdmin(): Promise<Build[]> {
  return (await sql<Row>("SELECT * FROM builds ORDER BY (status = 'archived'), created_at DESC")).map((r) => toBuild(r, true));
}

export async function buildAdmin(id: string): Promise<Build | null> {
  const r = await sqlOne<Row>("SELECT * FROM builds WHERE id = $1", [id]);
  return r ? toBuild(r, true) : null;
}

const opt = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);

export const buildSchema = z.object({
  status: z.enum(["draft", "live", "archived"]),
  title: z.string().trim().min(2, "Title is required").max(60),
  vehicle: z.string().trim().min(2, "Vehicle is required").max(80),
  owner: opt(60),
  city: opt(60),
  cost: z.number().int().min(0).max(100_000_000).nullable(),
  weeks: z.number().int().min(0).max(104).nullable(),
  brief: z.string().trim().min(10, "Describe the build (10+ characters)").max(800),
  tag: z.enum(BUILD_TAGS),
  mods: z.array(z.object({ group: z.string().trim().min(1).max(40), items: z.array(z.string().trim().min(1).max(140)).min(1).max(20) })).max(12),
  shop: z.array(z.string().trim().min(1).max(200)).max(12),
  photoIds: z.array(z.string().regex(/^fil_[A-Za-z0-9_-]{10,40}$/)).max(20),
});
export type BuildInput = z.infer<typeof buildSchema>;

export async function saveBuild(id: string | null, input: BuildInput, actor: string, ip: string): Promise<{ id: string; slug: string }> {
  if (input.status === "live" && input.photoIds.length === 0) {
    throw new ApiError(400, "invalid", "Some details need fixing.", { photoIds: "Add at least one photo before putting the build live." });
  }
  await assertPhotos(input.photoIds, "build_photo");
  const cols = [input.status, input.title, input.vehicle, input.owner, input.city, input.cost, input.weeks, input.brief, input.tag, JSON.stringify(input.mods), input.shop, input.photoIds];
  if (id) {
    const rows = await sql<{ id: string; slug: string }>(
      `UPDATE builds SET status=$2, title=$3, vehicle=$4, owner=$5, city=$6, cost=$7, weeks=$8, brief=$9, tag=$10, mods=$11::jsonb, shop=$12, photos=$13, updated_at=now()
        WHERE id = $1 RETURNING id, slug`,
      [id, ...cols],
    );
    if (!rows[0]) throw new ApiError(404, "not_found", "Build not found.");
    await audit({ type: "admin", id: actor }, "build.update", { ip, detail: { buildId: id, status: input.status } });
    return rows[0];
  }
  const newBuildId = newId("bld");
  const slug = `${slugify(`${input.title} ${input.vehicle}`).slice(0, 60) || "build"}-${newBuildId.slice(-4).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
  await sql(
    `INSERT INTO builds (id, slug, status, title, vehicle, owner, city, cost, weeks, brief, tag, mods, shop, photos, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15)`,
    [newBuildId, slug, ...cols, actor],
  );
  await audit({ type: "admin", id: actor }, "build.create", { ip, detail: { buildId: newBuildId, slug } });
  return { id: newBuildId, slug };
}
