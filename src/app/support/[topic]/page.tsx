import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { SUPPORT_POLICIES, findPolicy } from "@/lib/data/policies";

export function generateStaticParams() {
  return SUPPORT_POLICIES.map((p) => ({ topic: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const policy = findPolicy(SUPPORT_POLICIES, topic);
  if (!policy) return {};
  return {
    title: `${policy.title.charAt(0)}${policy.title.slice(1).toLowerCase()} — Customer Support`,
    description: policy.intro,
    alternates: { canonical: `/support/${policy.slug}` },
  };
}

export default async function SupportTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const policy = findPolicy(SUPPORT_POLICIES, topic);
  if (!policy) notFound();
  return <PolicyPage policy={policy} parent={{ label: "Support", href: "/contact" }} />;
}
