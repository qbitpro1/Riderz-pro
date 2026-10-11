import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/layout/SeoLandingPage";
import { findLanding, pageMeta } from "@/lib/data/seo";

const SLUG = "car-accessories";
const landing = findLanding(SLUG);

export const metadata: Metadata = landing
  ? pageMeta({ title: landing.title, description: landing.description, path: `/${SLUG}` })
  : {};

export default function Page() {
  if (!landing) notFound();
  return <SeoLandingPage landing={landing} />;
}
