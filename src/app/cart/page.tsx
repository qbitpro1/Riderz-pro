import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Your Cart",
    description: "Review your Riderzpro order, add installation and check out over WhatsApp.",
    path: "/cart",
  }),
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Your order</p>
        <h1 className="display-2 mb-8">CART</h1>
        <CartView />
      </div>
    </section>
  );
}
