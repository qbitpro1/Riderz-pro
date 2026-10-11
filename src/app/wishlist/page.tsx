import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "Products you saved on this device.",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Saved for later</p>
        <h1 className="display-3 mt-2">Your wishlist</h1>
        <WishlistView />
      </div>
    </section>
  );
}
