import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartContext";
import { SITE } from "@/lib/data/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Riderzpro — Buy. Build. Drive. | Cars, Accessories & Modification in India",
    template: "%s | Riderzpro",
  },
  description: SITE.description,
  keywords: [
    "car accessories",
    "car modification",
    "car audio",
    "car PPF",
    "body kits",
    "car facelift",
    "off-road accessories",
    "SUV modification",
    "used cars",
    "buy used cars",
    "sell used cars",
    "Thar accessories",
    "Fortuner accessories",
    "Creta facelift",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE.name,
    title: "Riderzpro — Buy. Build. Drive.",
    description: SITE.description,
    url: SITE.url,
  },
  twitter: { card: "summary_large_image", title: "Riderzpro — Buy. Build. Drive.", description: SITE.description },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
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
  "@type": "AutomotiveBusiness",
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
          // Structured data for the automotive business, rendered once at the root.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-accent focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:text-on-accent"
        >
          Skip to content
        </a>
        <CartProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <BottomNav />
          <WhatsAppFab />
        </CartProvider>
      </body>
    </html>
  );
}
