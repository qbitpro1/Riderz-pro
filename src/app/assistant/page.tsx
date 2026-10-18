import type { Metadata } from "next";
import { AssistantChat } from "@/components/assistant/AssistantChat";

export const metadata: Metadata = {
  title: "AI shopping assistant",
  description: "Ask Riderzpro's AI assistant for car accessories that fit your car, within your budget.",
  alternates: { canonical: "/assistant" },
};

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.slice(0, 600);
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-3xl">
        <p className="eyebrow mb-3">Ask, don&apos;t scroll</p>
        <h1 className="display-2">AI ASSISTANT</h1>
        <p className="mt-3 text-sm text-ash">Tell it your car, what you want and your budget. It searches Riderzpro&apos;s catalogue and shows parts you can add to your cart.</p>
        <div className="mt-8">
          <AssistantChat initialQuestion={q} />
        </div>
      </div>
    </section>
  );
}
