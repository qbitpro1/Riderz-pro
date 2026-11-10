/**
 * THE UNIFIED CATALOGUE: shapes, brands and the filter engine
 *
 * The products themselves are in the database (catalog_products). Read them with the functions in
 * src/lib/server/catalog.ts (getCatalog, catalogFor, getProductDetail, …), never from files; the
 * brand price lists are only the import source (./file-source, src/lib/store/file-source).
 */

import { fitsModel as houseFitsModel } from "@/lib/data/products";

export * from "./brands";
export * from "./filters";
export * from "./types";

/** House fitment logic, re-exported so callers don't reach past this module. */
export const productFitsModel = houseFitsModel;
