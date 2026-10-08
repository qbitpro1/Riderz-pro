import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/layout/SeoLandingPage";
import { findLanding } from "@/lib/data/seo";

const SLUG = "suv-modification";
const landing = findLanding(SLUG);

export const metadata: Metadata = {
  title: landing?.title,
  description: landing?.description,
  alternates: { canonical: `/${SLUG}` },
};

export default function Page() {
  if (!landing) notFound();
  return <SeoLandingPage landing={landing} />;
}
