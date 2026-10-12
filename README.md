# Riderzpro

Car & bike accessories online at https://riderzpro.com. Riderzpro is a registered trademark of
Motorbotz Automotive Pvt. Ltd., which makes and sells the range. The store carries the Riderzpro
house range plus RECOIL, Blaupunkt and Autoform, across eight departments, with fitment checks per
car and installation at the company's garages in Bengaluru, Hyderabad and Pune.

Secondary areas, under the "Cars" and "Services" menus: garage and detailing services (PPF, audio, body kits,
off-road, interiors, performance), used-car buy/sell, and the Mahindra BE 6 programme.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (CSS-first
`@theme` in `src/app/globals.css`). No database: content is typed modules plus imported catalogue
data under `data/`. Next 16 differs from older versions; check `node_modules/next/dist/docs/`
before using a Next API you are unsure of (see `AGENTS.md`).

## Run

```bash
npm ci
npm run dev        # http://localhost:3000
npm run typecheck
npm run build && npm start
```

Other scripts (`package.json`): `catalog:rebuild`, `sync:recoil`, `verify:recoil`, `import:recoil`,
`import:blaupunkt`, `extract:pdf-images`, `inventory:refresh`, `inventory:check-robots`.

## Architecture

The flow is one direction: taxonomy, then catalogue, then store contract, then the product page.

- **Taxonomy** (`src/lib/data/taxonomy.ts`): the eight departments (interior, exterior,
  multimedia, covers & guards, utilities, off-roading, lighting, accessories), their groups, and their
  URLs (`/shop/{department}`, `?group=`, `?oe=1`). Navigation, home and shop all read from it.
- **Catalogue** (`src/lib/catalog`): every brand's products projected into one `CatalogItem` shape,
  with filters, sorting and facets. The shop reads filters from the query string (`?brand`, `?group`,
  `?oe`, `?max`, `?sort`, `?q`). Brand definitions live in `catalog/brands.ts`.
- **Store contract** (`src/lib/store`): `types.ts` is the product-detail and cart-line shape;
  `products.ts` builds `PRODUCT_DETAILS` server-side, each with an `indexable` flag. Every product
  lives at `/products/{slug}` (`productHref`).
- **Product page** (`src/app/products/[slug]`): one page for every product, emitting `Product` JSON-LD.
- **Cart** (`src/components/cart`): React context persisted to localStorage; checkout hands the
  order to WhatsApp.
- **Collections** (`src/lib/data/collections.ts`): curated predicates over catalogue fields
  (bestsellers, price caps, real savings of at least 10% off MRP, originals, fitted by us). Pages at
  `/collections/{slug}` exist only for collections that match at least one product.
- **Navigation data** (`src/lib/data/nav.ts`): every menu (header, More panel, drawer, bottom bar,
  footer) is data. Change a menu there, not in components.
- **Server-only rule**: `src/lib/catalog` (index), `src/lib/store/products.ts` and `src/lib/search`
  hold dealer prices and import `server-only`. Never import them from a client component; pass
  plain props down instead. Client-safe modules (taxonomy, collections, nav, `store/types.ts`) hold
  no dealer data.
- **Brand stores**: `/recoil` and `/autoform` keep deeper catalogues; `/brands/{slug}` pages show
  each brand's range with the shop filters.

### Themes

Two themes (light and dark) via tokens in `globals.css`. Use token classes only: `bg-void`,
`bg-carbon`, `text-chalk`, `text-ash`, `text-dim`, `text-accent`, `border-tint/N`. Never use
`white/N`, `black/N`, hex or rgba in class names. Text laid over a photograph must sit in a block
with `data-theme="dark"` plus the `.scrim`, so it stays legible in both themes.

### SEO layer

- `src/app/layout.tsx`: site-wide metadata, `AutoPartsStore` and `WebSite` JSON-LD (the search action
  targets `/shop?q=`).
- `src/lib/data/seo.ts`: landing-page copy plus `pageMeta` (canonical ignores the query string, so
  filtered views consolidate), `breadcrumbLd`, `itemListLd`, `ldJson`.
- `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` / `twitter-image.tsx`, `not-found.tsx`.
- Only products with `indexable: true` are in the sitemap; others carry `noindex`.
- SEO landings: `/car-accessories`, `/car-modification`, `/suv-modification`, `/used-cars`.

## Launch checklist

- [ ] Domain `riderzpro.com` pointed at the host; `SITE.url` in `src/lib/data/site.ts` matches it.
- [ ] Verify `SITE` details (phone, email, socials, GSTIN) and the organisation address and rating
      in `src/app/layout.tsx` before launch.
- [ ] Shopify (or other checkout): follow `docs/SHOPIFY_SETUP.md`.
- [ ] Real product photography replacing stock images where the catalogue still uses `MEDIA` keys.
- [ ] Analytics and tag IDs (none are wired yet); submit `/sitemap.xml` in Search Console.
- [ ] Logo as vector: only `public/brand/riderzpro-logo.png` exists; the social card
      (`opengraph-image.tsx`) is a typographic stand-in.
- [ ] Review the legal and support pages with the company.
- [ ] `npm run build` clean; check `/robots.txt`, `/sitemap.xml` and `/opengraph-image` on the live host.
