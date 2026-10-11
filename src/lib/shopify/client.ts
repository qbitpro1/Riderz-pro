import "server-only";
import { getShopifyConfig } from "./config";

/** A failure talking to Shopify. `message` is safe to log; it never carries the token. */
export class ShopifyError extends Error {
  constructor(
    public kind: "not-configured" | "network" | "http" | "graphql" | "user-errors",
    message: string,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

export type UserError = { field?: string[] | null; message: string };

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

/**
 * Minimal Storefront API client (no SDK). Throws `ShopifyError` on network
 * problems, non-2xx responses and GraphQL `errors`. Mutation `userErrors` are
 * returned in the data; use `assertNoUserErrors` to turn them into a throw.
 */
export async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const cfg = getShopifyConfig();
  if (!cfg) throw new ShopifyError("not-configured", "Shopify is not configured");

  let res: Response;
  try {
    res = await fetch(`https://${cfg.domain}/api/${cfg.apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Storefront-Access-Token": cfg.token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ShopifyError("network", "Could not reach Shopify");
  }

  if (!res.ok) {
    throw new ShopifyError("http", `Shopify responded with HTTP ${res.status}`);
  }

  let body: GraphQLResponse<T>;
  try {
    body = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new ShopifyError("http", "Shopify returned an unreadable response");
  }

  if (body.errors?.length) {
    throw new ShopifyError("graphql", body.errors.map((e) => e.message).join("; ").slice(0, 300));
  }
  if (!body.data) throw new ShopifyError("graphql", "Shopify returned no data");
  return body.data;
}

export function assertNoUserErrors(errors: UserError[] | null | undefined): void {
  if (errors?.length) {
    throw new ShopifyError("user-errors", errors.map((e) => e.message).join("; ").slice(0, 300));
  }
}
