import "server-only";

import { z } from "zod";
import { sql, sqlOne } from "@/lib/db/client";
import { BODY_TYPES, CAR_STATUSES, DRIVETRAINS, FUELS, TRANSMISSIONS, ownerLabel, type Car } from "@/lib/data/cars";
import { fileHref, } from "@/lib/vendor/types";
import { slugify } from "@/lib/vendor/validators";
import { ApiError } from "./http";
import { newId } from "./security";
import { audit } from "./vendors";

/**
 * RIDERZPRO'S OWN CARS FOR SALE (car_listings)
 *
 * The team adds, edits, marks sold and archives cars in /admin/cars. The site shows live cars (and
 * sold ones, marked sold) through the inventory pipeline (src/lib/inventory, connector
 * riderzpro-direct) and the car pages. Nothing here is sample data: an empty table shows no cars.
 */

type Row = {
  id: string; slug: string; status: Car["status"]; make: string; model: string; variant: string; year: number; price: number; km: number;
  fuel: Car["fuel"]; transmission: Car["transmission"]; owners: number; city: string; state: string; body_type: Car["body"];
  engine: string | null; power: string | null; drivetrain: Car["drivetrain"]; colour: string | null; registration: string | null;
  insurance: string | null; service_history: string | null; note: string; highlights: string[]; modifications: Car["modifications"];
  photos: string[]; financing: boolean; featured: boolean; created_at: Date; updated_at: Date;
};

const toCar = (r: Row, admin = false): Car => ({
  id: r.id,
  slug: r.slug,
  status: r.status,
  brand: r.make,
  model: r.model,
  variant: r.variant,
  year: r.year,
  price: r.price,
  km: r.km,
  fuel: r.fuel,
  transmission: r.transmission,
  owners: r.owners,
  owner: ownerLabel(r.owners),
  city: r.city,
  state: r.state,
  body: r.body_type,
  engine: r.engine,
  power: r.power,
  drivetrain: r.drivetrain,
  colour: r.colour,
  registration: r.registration,
  insurance: r.insurance,
  serviceHistory: r.service_history,
  note: r.note,
  highlights: r.highlights,
  modifications: r.modifications,
  // Drafts' photos are not public yet: the admin previews them through the admin file route.
  photos: r.photos.map((id) => (admin ? `/api/admin/files/${id}` : fileHref(id))),
  photoIds: r.photos,
  financing: r.financing,
  featured: r.featured,
  createdAt: new Date(r.created_at).toISOString(),
});

/** Cars a shopper can see: live, and sold ones (shown as sold). Newest first. Empty without a database. */
export async function publicCars(): Promise<Car[]> {
  try {
    const rows = await sql<Row>("SELECT * FROM car_listings WHERE status IN ('live','sold') ORDER BY (status = 'live') DESC, featured DESC, created_at DESC");
    return rows.map((r) => toCar(r));
  } catch {
    return [];
  }
}

export async function publicCar(slug: string): Promise<Car | null> {
  const r = await sqlOne<Row>("SELECT * FROM car_listings WHERE slug = $1 AND status IN ('live','sold')", [slug]);
  return r ? toCar(r) : null;
}

/** Similar live cars: same body, same make, close price, same city. */
export async function relatedCars(car: Car, limit = 3): Promise<Car[]> {
  return (await publicCars())
    .filter((c) => c.id !== car.id && c.status === "live")
    .map((c) => ({ c, score: (c.body === car.body ? 3 : 0) + (c.brand === car.brand ? 2 : 0) + (Math.abs(c.price - car.price) < 5_00_000 ? 2 : 0) + (c.city === car.city ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}

/** Changes whenever a car is added or edited (the inventory snapshot follows it). */
export async function carsVersion(): Promise<string> {
  const r = await sqlOne<{ v: string }>("SELECT concat(max(updated_at), '|', count(*)) AS v FROM car_listings");
  return r?.v ?? "";
}

/** Every car with its raw row, for the inventory connector. */
export async function carRowsForInventory(): Promise<Car[]> {
  const rows = await sql<Row>("SELECT * FROM car_listings WHERE status IN ('live','sold') ORDER BY created_at DESC");
  return rows.map((r) => toCar(r));
}

/* ------------------------------------------------------------- admin */

export async function listCarsAdmin(): Promise<Car[]> {
  const rows = await sql<Row>("SELECT * FROM car_listings ORDER BY (status = 'archived'), created_at DESC");
  return rows.map((r) => toCar(r, true));
}

export async function carAdmin(id: string): Promise<Car | null> {
  const r = await sqlOne<Row>("SELECT * FROM car_listings WHERE id = $1", [id]);
  return r ? toCar(r, true) : null;
}

const t = (min: number, max: number, label: string) => z.string().trim().min(min, `${label} is required`).max(max);
const opt = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);

export const carSchema = z.object({
  status: z.enum(CAR_STATUSES),
  make: t(2, 40, "Make"),
  model: t(1, 40, "Model"),
  variant: t(1, 80, "Variant"),
  year: z.number().int().min(1980).max(2100),
  price: z.number().int().min(10_000, "Enter the price in rupees").max(100_000_000),
  km: z.number().int().min(0).max(2_000_000),
  fuel: z.enum(FUELS as [string, ...string[]]),
  transmission: z.enum(TRANSMISSIONS as [string, ...string[]]),
  owners: z.number().int().min(1).max(9),
  city: t(2, 60, "City"),
  state: t(2, 60, "State"),
  body: z.enum(BODY_TYPES),
  engine: opt(60),
  power: opt(60),
  drivetrain: z.enum(DRIVETRAINS as [string, ...string[]]),
  colour: opt(40),
  registration: opt(80),
  insurance: opt(120),
  serviceHistory: opt(200),
  note: t(10, 600, "Description"),
  highlights: z.array(z.string().trim().min(2).max(140)).max(12),
  modifications: z.array(z.object({ name: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(200) })).max(20),
  photoIds: z.array(z.string().regex(/^fil_[A-Za-z0-9_-]{10,40}$/)).max(20),
  financing: z.boolean(),
  featured: z.boolean(),
});
export type CarInput = z.infer<typeof carSchema>;

async function assertPhotos(ids: string[], kind: "car_photo" | "build_photo") {
  if (ids.length === 0) return;
  const rows = await sql<{ id: string }>("SELECT id FROM files WHERE id = ANY($1::text[]) AND kind = $2 AND vendor_id IS NULL", [ids, kind]);
  if (rows.length !== new Set(ids).size) throw new ApiError(400, "bad_file", "One of the photos could not be found. Upload it again.");
}
export { assertPhotos };

/** Adds a car (id null) or saves changes to one. Live and sold cars need at least one photo. */
export async function saveCar(id: string | null, input: CarInput, actor: string, ip: string): Promise<{ id: string; slug: string }> {
  if ((input.status === "live" || input.status === "sold") && input.photoIds.length === 0) {
    throw new ApiError(400, "invalid", "Some details need fixing.", { photoIds: "Add at least one photo before putting the car live." });
  }
  await assertPhotos(input.photoIds, "car_photo");
  const cols = [
    input.status, input.make, input.model, input.variant, input.year, input.price, input.km, input.fuel, input.transmission, input.owners,
    input.city, input.state, input.body, input.engine, input.power, input.drivetrain, input.colour, input.registration, input.insurance,
    input.serviceHistory, input.note, JSON.stringify(input.highlights), JSON.stringify(input.modifications), input.photoIds, input.financing, input.featured,
  ];
  if (id) {
    const rows = await sql<{ id: string; slug: string }>(
      `UPDATE car_listings SET status=$2, make=$3, model=$4, variant=$5, year=$6, price=$7, km=$8, fuel=$9, transmission=$10, owners=$11,
              city=$12, state=$13, body_type=$14, engine=$15, power=$16, drivetrain=$17, colour=$18, registration=$19, insurance=$20,
              service_history=$21, note=$22, highlights=$23::jsonb, modifications=$24::jsonb, photos=$25, financing=$26, featured=$27,
              sold_at = CASE WHEN $2 = 'sold' THEN COALESCE(sold_at, now()) ELSE NULL END, updated_at = now()
        WHERE id = $1 RETURNING id, slug`,
      [id, ...cols],
    );
    if (!rows[0]) throw new ApiError(404, "not_found", "Car not found.");
    await audit({ type: "admin", id: actor }, "car.update", { ip, detail: { carId: id, status: input.status, price: input.price } });
    return rows[0];
  }
  const newCarId = newId("car");
  const base = slugify(`${input.year} ${input.make} ${input.model} ${input.variant}`).slice(0, 70) || "car";
  const slug = `${base}-${newCarId.slice(-5).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
  await sql(
    `INSERT INTO car_listings (id, slug, status, make, model, variant, year, price, km, fuel, transmission, owners, city, state, body_type,
                               engine, power, drivetrain, colour, registration, insurance, service_history, note, highlights, modifications,
                               photos, financing, featured, created_by, sold_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24::jsonb,$25::jsonb,$26,$27,$28,$29,
             CASE WHEN $3 = 'sold' THEN now() END)`,
    [newCarId, slug, ...cols, actor],
  );
  await audit({ type: "admin", id: actor }, "car.create", { ip, detail: { carId: newCarId, slug } });
  return { id: newCarId, slug };
}
