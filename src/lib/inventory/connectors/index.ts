import { importAllowed } from "../compliance";
import { SOURCES } from "../sources";
import type { Listing } from "../types";
import { motorbotzDirect } from "./motorbotz-direct";
import { dealerFeed } from "./dealer-feed";
import { blockedConnector } from "./blocked";

/**
 * A source connector. `pull` is only ever called after the compliance gate has
 * cleared the source, and a blocked connector throws if it is called anyway.
 */
export type Connector = {
  sourceId: string;
  /** Returns listings this source is permitted to contribute. */
  pull: () => Listing[];
};

export const CONNECTORS: Connector[] = [
  motorbotzDirect,
  dealerFeed,
  // Marketplace connectors exist so the wiring is ready the day a licence
  // lands. Until then they refuse to run rather than degrading into scraping.
  ...SOURCES.filter((s) => s.status === "BLOCKED_NO_LICENCE").map((s) => blockedConnector(s.id)),
];

export type PullResult = {
  sourceId: string;
  listings: Listing[];
  skipped: boolean;
  reason: string | null;
};

/** Runs every connector through the compliance gate and collects the results. */
export function pullAll(): PullResult[] {
  return CONNECTORS.map((connector) => {
    const gate = importAllowed(connector.sourceId);
    if (!gate.allowed) {
      return { sourceId: connector.sourceId, listings: [], skipped: true, reason: gate.reason };
    }
    try {
      return { sourceId: connector.sourceId, listings: connector.pull(), skipped: false, reason: null };
    } catch (error) {
      return {
        sourceId: connector.sourceId,
        listings: [],
        skipped: true,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
