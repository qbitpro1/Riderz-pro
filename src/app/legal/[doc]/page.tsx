import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { LEGAL_POLICIES, findPolicy } from "@/lib/data/policies";

export function generateStaticParams() {
  return LEGAL_POLICIES.map((p) => ({ doc: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const policy = findPolicy(LEGAL_POLICIES, doc);
  if (!policy) return {};
  return {
    title: `${policy.title.charAt(0)}${policy.title.slice(1).toLowerCase()}`,
    description: policy.intro,
    alternates: { canonical: `/legal/${policy.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function LegalDocPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const policy = findPolicy(LEGAL_POLICIES, doc);
  if (!policy) notFound();
  return <PolicyPage policy={policy} parent={{ label: "Legal", href: "/legal/terms" }} />;
}
