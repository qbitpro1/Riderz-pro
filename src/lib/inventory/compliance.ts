import { getSource } from "./sources";
import type { Listing, Source } from "./types";

/**
 * The compliance gate.
 *
 * Every connector has to pass through here before it fetches anything, and
 * every listing passes through here before it renders. The rule is simple:
 * permission is proven, never assumed. A source with no licence produces no
 * imports, no images and no reproduced copy — the connector throws rather than
 * degrading quietly, because a silent degrade is how unlicensed data ends up
 * on a page.
 */

export class ComplianceError extends Error {
  constructor(
    readonly sourceId: string,
    readonly reason: string,
  ) {
    super(`[compliance] ${sourceId}: ${reason}`);
    this.name = "ComplianceError";
  }
}

export function requireSource(sourceId: string): Source {
  const source = getSource(sourceId);
  if (!source) throw new ComplianceError(sourceId, "unknown source — not in the registry");
  return source;
}

/** Throws unless this source is licensed and switched on for import. */
export function assertImportAllowed(sourceId: string): Source {
  const source = requireSource(sourceId);

  if (source.status === "BLOCKED_NO_LICENCE") {
    throw new ComplianceError(
      sourceId,
      [
        "no data licence on file, so import is refused.",
        source.evidence.robotsUrl ? `robots.txt (${source.evidence.robotsUrl}) blocks: ${source.evidence.blockingRules.join("; ")}` : "",
        source.evidence.note,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
  if (source.status === "PAUSED") throw new ComplianceError(sourceId, "source is paused by the operator");
  if (!source.rules.canImport) throw new ComplianceError(sourceId, "rules.canImport is false");

  return source;
}

/** Non-throwing variant for reporting. */
export function importAllowed(sourceId: string): { allowed: boolean; reason: string | null } {
  try {
    assertImportAllowed(sourceId);
    return { allowed: true, reason: null };
  } catch (error) {
    return { allowed: false, reason: error instanceof ComplianceError ? error.reason : String(error) };
  }
}

export function canDisplayImages(sourceId: string): boolean {
  const source = getSource(sourceId);
  return Boolean(source && source.status === "LIVE" && source.rules.canDisplayImages);
}

export function canReproduceDescription(sourceId: string): boolean {
  const source = getSource(sourceId);
  return Boolean(source && source.status === "LIVE" && source.rules.canReproduceDescriptions);
}

/**
 * What the customer is told about where a listing came from. Attribution and
 * an outbound link are only rendered when the source requires or permits them.
 */
export function attributionFor(listing: Listing): {
  label: string;
  showSourceName: boolean;
  sourceName: string | null;
  url: string | null;
} {
  const primary = listing.sources.find((s) => s.sourceId === listing.primarySourceId) ?? listing.sources[0];
  const source = primary ? getSource(primary.sourceId) : undefined;

  if (!source || source.id === "riderzpro-direct") {
    return { label: "Riderzpro inventory", showSourceName: false, sourceName: null, url: null };
  }

  const showUrl = Boolean(primary?.urlDisplayable && primary.url && source.rules.originalUrlRequired);

  return {
    label: source.level === 1 ? "Available through partner" : "Source listing",
    showSourceName: source.rules.attributionRequired,
    sourceName: source.rules.attributionRequired ? source.name : null,
    url: showUrl ? primary!.url : null,
  };
}

/**
 * A listing may only claim RIDERZPRO VERIFIED if we actually inspected it.
 * This is checked at render time as well as at write time, so a bad import
 * cannot promote a third-party car into our own verified stock.
 */
export function verifiedBadgeAllowed(listing: Listing): boolean {
  return listing.verification === "RIDERZPRO_VERIFIED" && listing.inspection !== null;
}

/** Images render only when the licence behind each one holds up. */
export function displayableImages(listing: Listing) {
  return listing.images.filter((img) => {
    if (img.licence === "riderzpro-own") return true;
    if (img.licence === "dealer-permission") return canDisplayImages(listing.primarySourceId);
    if (img.licence === "licensed-feed") return canDisplayImages(listing.primarySourceId);
    return false;
  });
}
