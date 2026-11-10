import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { BuyBox } from "@/components/product/BuyBox";
import { FitsYourCar } from "@/components/product/FitsYourCar";
import { ProductDetails } from "@/components/product/ProductDetails";
import { ProductGallery } from "@/components/product/ProductGallery";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { ldJson } from "@/lib/data/seo";
import { SITE } from "@/lib/data/site";
import { DEPARTMENT_BY_SLUG, departmentHref, groupHref } from "@/lib/data/taxonomy";
import { MEDIA } from "@/lib/media";
import { getProductDetail, relatedProducts } from "@/lib/server/catalog";
import { productReviews } from "@/lib/server/reviews";
import { ReviewCard } from "@/components/community/Cards";
import { productHref, type ProductDetail, type ProductImage } from "@/lib/store/types";

// Products come from the database (catalog_products): each page is rendered on request, and a
// product the admin hid or never added is a plain 404.
export const dynamic = "force-dynamic";

function absolute(src: string): string {
  return src.startsWith("http") ? src : `${SITE.url}${src.startsWith("/") ? "" : "/"}${src}`;
}

function imageUrl(image: ProductImage): string {
  return absolute(image.kind === "media" ? MEDIA[image.key].src : image.src);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getProductDetail(slug);
  if (!d) return {};
  const title = d.code && !d.title.includes(d.code) ? `${d.title} (${d.code})` : d.title;
  const description =
    d.summary ??
    `${d.title} by ${d.brandName}${d.code ? `, model ${d.code}` : ""}. Available from Riderzpro with installation at our garages.`;
  return {
    title,
    description,
    alternates: { canonical: productHref(slug) },
    openGraph: {
      // Next's OpenGraph typings have no "product" type.
      type: "website",
      url: productHref(slug),
      siteName: SITE.name,
      locale: "en_IN",
      title,
      description,
      images: d.images[0] ? [imageUrl(d.images[0])] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: d.images[0] ? [imageUrl(d.images[0])] : undefined,
    },
    ...(d.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/**
 * The Offer for a buyable product. A from-priced product (options raise the price) is an
 * AggregateOffer spanning the cheapest to the dearest combination of its available choices.
 */
function offersLd(detail: ProductDetail, availability: string, url: string) {
  const base = {
    priceCurrency: "INR",
    availability,
    seller: { "@type": "Organization", name: SITE.name },
    url,
  };
  const price = detail.price ?? 0;
  if (!detail.priceFrom || detail.options.length === 0) return { "@type": "Offer", price, ...base };

  let low = price;
  let high = price;
  let count = 1;
  for (const o of detail.options) {
    const deltas = o.values.filter((v) => v.available).map((v) => v.priceDelta);
    if (deltas.length === 0) return { "@type": "Offer", price, ...base };
    low += Math.min(...deltas);
    high += Math.max(...deltas);
    count *= deltas.length;
  }
  return { "@type": "AggregateOffer", lowPrice: low, highPrice: high, offerCount: count, ...base };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getProductDetail(slug);
  if (!detail) notFound();

  const [related, reviews] = await Promise.all([relatedProducts(slug, 8), productReviews(slug, 6)]);
  const department = DEPARTMENT_BY_SLUG[detail.department];

  // A held-back or coming-soon product cannot be bought, so it advertises no price or availability.
  const sellable = detail.price !== null && detail.indexable && detail.availability !== "coming-soon";

  const availabilityUrl =
    detail.availability === "coming-soon"
      ? "https://schema.org/PreOrder"
      : detail.availability === "made-to-order"
        ? "https://schema.org/BackOrder"
        : detail.availability === "out-of-stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock";

  const offers = sellable ? offersLd(detail, availabilityUrl, `${SITE.url}${productHref(slug)}`) : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detail.title,
    brand: { "@type": "Brand", name: detail.brandName },
    ...(detail.code ? { sku: detail.code } : {}),
    ...(detail.summary ? { description: detail.summary } : {}),
    ...(detail.images.length ? { image: detail.images.map(imageUrl) } : {}),
    ...(offers ? { offers } : {}),
    // Only approved customer reviews (src/lib/server/reviews.ts) make a rating.
    ...(detail.rating !== null && detail.reviews ? { aggregateRating: { "@type": "AggregateRating", ratingValue: detail.rating, reviewCount: detail.reviews } } : {}),
  };

  return (
    <>
      {detail.price !== null && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(schema) }} />
      )}

      <section className="pt-20 md:pt-28">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: department.name, href: departmentHref(detail.department) },
              { label: detail.groupName, href: groupHref(detail.department, detail.group) },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <ProductGallery images={detail.images} brandName={detail.brandName} />
            </div>
            <div className="min-w-0">
              <BuyBox detail={detail} />
              <div className="mt-6">
                <FitsYourCar fitment={detail.fitment} title={detail.title} code={detail.code} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <ProductDetails detail={detail} />
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section border-t border-tint/8" aria-labelledby="reviews-title">
          <div className="shell">
            <h2 id="reviews-title" className="eyebrow">
              Customer reviews · {detail.rating?.toFixed(1)} / 5 from {detail.reviews} review{detail.reviews === 1 ? "" : "s"}
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id}>
                  <ReviewCard review={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section border-t border-tint/8 bg-carbon">
          <div className="shell">
            <h2 className="eyebrow">You may also like</h2>
            <ul className="rail mt-4">
              {related.map((item) => (
                <li key={item.id} className="w-[46vw] max-w-[15rem]">
                  <CatalogCard item={item} sizes="240px" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <RecentlyViewed
        current={{ slug, title: detail.title, price: sellable ? detail.price : null, image: detail.images[0] ?? null }}
      />
    </>
  );
}
