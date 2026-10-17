/**
 * Module hooks for scripts/test-invoice.mjs: lets plain Node (24+, which strips TypeScript types)
 * load the app's server modules. Resolves "@/..." to src/, adds .ts / .tsx / index.ts to
 * extensionless imports, and turns "server-only" into an empty module. Test use only.
 */
import { existsSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "src");
const EXTS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function withExtension(path) {
  if (existsSync(path) && statSync(path).isFile()) return path;
  for (const e of EXTS) if (existsSync(path + e)) return path + e;
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
  // next/server, next/headers … are CommonJS files without an exports map.
  if (/^next\/[a-z-]+$/.test(specifier)) return next(`${specifier}.js`, context);
  let base = null;
  if (specifier.startsWith("@/")) base = resolvePath(SRC, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parent = fileURLToPath(context.parentURL);
    if (parent.startsWith(SRC)) base = resolvePath(dirname(parent), specifier);
  }
  if (base) {
    const found = withExtension(base);
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  // JSON imported without an import attribute (fine for the bundler, not for Node).
  if (url.endsWith(".json")) return next(url, { ...context, importAttributes: { type: "json" } });
  return next(url, context);
}
