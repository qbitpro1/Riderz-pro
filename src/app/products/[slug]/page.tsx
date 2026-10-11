import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { BuyBox } from "@/components/product/BuyBox";
import { FitsYourCar } from "@/components/product/FitsYourCar";
import { ProductDetails } from "@/components/product/ProductDetails";
import { ProductGallery } from "@/components/product/ProductGallery";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { SITE } from "@/lib/data/site";
import { DEPARTMENT_BY_SLUG, departmentHref, groupHref } from "@/lib/data/taxonomy";
import { MEDIA } from "@/lib/media";
import { getProductDetail, PRODUCT_SLUGS, relatedProducts } from "@/lib/store/products";
import { productHref, type ProductImage } from "@/lib/store/types";

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

function absolute(src: string): string {
  return src.startsWith("http") ? src : `${SITE.url}${src.startsWith("/") ? "" : "/"}${src}`;
}

function imageUrl(image: ProductImage): string {
  return absolute(image.kind === "media" ? MEDIA[image.key].src : image.src);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = getProductDetail(slug);
  if (!d) return {};
  const title = d.code && !d.title.includes(d.code) ? `${d.title} (${d.code})` : d.title;
  const description =
    d.summary ??
    `${d.title} by ${d.brandName}${d.code ? `, model ${d.code}` : ""}. Available from Riderzpro with installation at our garages.`;
  return {
    title,
    description,
    alternates: { canonical: productHref(slug) },
    openGraph: { title, description, images: d.images[0] ? [imageUrl(d.images[0])] : undefined },
    ...(d.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getProductDetail(slug);
  if (!detail) notFound();

  const related = relatedProducts(slug, 8);
  const department = DEPARTMENT_BY_SLUG[detail.department];

  const availabilityUrl =
    detail.availability === "coming-soon"
      ? "https://schema.org/PreOrder"
      : detail.availability === "made-to-order"
        ? "https://schema.org/BackOrder"
        : "https://schema.org/InStock";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detail.title,
    brand: { "@type": "Brand", name: detail.brandName },
    ...(detail.code ? { sku: detail.code } : {}),
    ...(detail.summary ? { description: detail.summary } : {}),
    ...(detail.images.length ? { image: detail.images.map(imageUrl) } : {}),
    ...(detail.price !== null
      ? {
          offers: {
            "@type": "Offer",
            price: detail.price,
            priceCurrency: "INR",
            availability: availabilityUrl,
            seller: { "@type": "Organization", name: SITE.name },
            url: `${SITE.url}${productHref(slug)}`,
          },
        }
      : {}),
    ...(detail.rating !== null && detail.reviews !== null
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: detail.rating, reviewCount: detail.reviews } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

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

      {related.length > 0 && (
        <section className="section border-t border-tint/8 bg-carbon">
          <div className="shell">
            <p className="eyebrow">You may also like</p>
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
        current={{ slug, title: detail.title, price: detail.price, image: detail.images[0] ?? null }}
      />
    </>
  );
}
