import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/account/SignInForm";
import { currentCustomer } from "@/lib/server/customers";
import { safeNext } from "@/lib/account/types";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Riderzpro with a one-time code to see your orders, addresses and saved products.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Search = { next?: string | string[] };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SignInPage({ searchParams }: { searchParams: Promise<Search> }) {
  const next = safeNext(first((await searchParams).next));
  if (await currentCustomer()) redirect(next);
  return (
    <section className="shell pb-16 pt-28 md:pb-24 md:pt-36">
      <SignInForm next={next} />
    </section>
  );
}
