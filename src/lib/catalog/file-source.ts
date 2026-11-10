/**
 * THE CATALOGUE IMPORT SOURCE (listing items)
 *
 * The site reads its catalogue from the database (catalog_products, src/lib/server/catalog.ts).
 * This is only what the import reads: every brand's products from their price lists and the house
 * range, projected into one `CatalogItem` list. Nothing but the import should use it.
 */

import "server-only";

import { autoformItems, blaupunktItems, houseItems, recoilItems } from "./adapters";
import type { CatalogItem } from "./types";

export const FILE_CATALOG: CatalogItem[] = [...houseItems(), ...recoilItems(), ...autoformItems(), ...blaupunktItems()];
