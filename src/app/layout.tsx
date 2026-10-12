import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartContext";
import { LIVE_GROUPS } from "@/lib/catalog";
import { SITE } from "@/lib/data/site";
import { ldJson } from "@/lib/data/seo";
import { THEME_COLOR, THEME_SCRIPT } from "@/components/theme/theme";
import { InlineScript } from "@/components/theme/InlineScript";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DEFAULT_TITLE = "Riderzpro: Car & Bike Accessories";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: DEFAULT_TITLE, template: "%s | Riderzpro" },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "car accessories",
    "bike accessories",
    "car accessories online India",
    "car seat covers",
    "car floor mats",
    "car audio",
    "car lighting",
    "off-road accessories",
    "SUV accessories",
    "Thar accessories",
    "Fortuner accessories",
    "Riderzpro",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE.name,
    title: DEFAULT_TITLE,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: SITE.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  "@id": `${SITE.url}/#organization`,
  legalName: SITE.legalName.replace(/\.$/, ""),
  logo: `${SITE.url}/brand/riderzpro-logo.png`,
  image: `${SITE.url}/opengraph-image`,
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  telephone: SITE.phone,
  email: SITE.email,
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 14, Hosur Main Road, Kudlu Gate",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: "560068",
    addressCountry: "IN",
  },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "3184" },
  sameAs: [SITE.instagram, SITE.youtube, SITE.facebook],
};

// /shop?q= is read by the catalogue filters, so this search action really searches.
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  name: SITE.name,
  url: SITE.url,
  publisher: { "@id": `${SITE.url}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/shop?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `data-theme` is corrected before paint by THEME_SCRIPT, hence suppressHydrationWarning.
    <html lang="en-IN" data-theme="light" className={`${archivo.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body>
        <script
          type="application/ld+json"
          // Structured data for the store, rendered once at the root.
          dangerouslySetInnerHTML={{ __html: ldJson(ORG_SCHEMA) }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(WEBSITE_SCHEMA) }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-accent focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:text-on-accent"
        >
          Skip to content
        </a>
        <CartProvider>
          <Header liveGroups={LIVE_GROUPS} />
          <main id="main">{children}</main>
          <Footer />
          <BottomNav />
          <WhatsAppFab />
        </CartProvider>
      </body>
    </html>
  );
}
