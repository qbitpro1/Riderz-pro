import { assertImportAllowed } from "../compliance";
import type { Connector } from "./index";

/**
 * The connector we ship for every marketplace we have no licence for.
 *
 * It deliberately does nothing except assert the compliance gate and fail. The
 * point is that the integration surface exists — the source is registered, the
 * refresh runner knows about it, the dashboard reports on it — so switching it
 * on is a matter of recording a licence, not writing new code. What it will
 * never do is quietly fall back to scraping a site that has told us not to.
 */
export function blockedConnector(sourceId: string): Connector {
  return {
    sourceId,
    pull() {
      // Throws a ComplianceError carrying the robots.txt evidence.
      assertImportAllowed(sourceId);
      // Unreachable: assertImportAllowed always throws for a blocked source.
      // If a licence is later recorded, replace this connector with a real
      // implementation against the licensed API or feed.
      throw new Error(
        `${sourceId}: licence recorded but no implementation yet. Build the connector against the licensed API before enabling.`,
      );
    },
  };
}
