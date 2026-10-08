"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { whatsapp } from "@/lib/data/site";

/** Contextual WhatsApp copy so the first message already carries intent. */
const CONTEXT: { match: RegExp; label: string; message: string }[] = [
  { match: /^\/cars\//, label: "Ask about this car", message: "Hi Riderzpro, I'm interested in this car: " },
  { match: /^\/cars/, label: "Find me a car", message: "Hi Riderzpro, I'm looking for a car. My budget is " },
  { match: /^\/sell/, label: "Sell my car", message: "Hi Riderzpro, I want to sell my car. Registration number: " },
  { match: /^\/product\//, label: "Check fitment", message: "Hi Riderzpro, will this fit my car? Product: " },
  { match: /^\/shop/, label: "Check fitment", message: "Hi Riderzpro, I need help choosing accessories for my " },
  { match: /^\/build/, label: "Get build quote", message: "Hi Riderzpro, I want a quote for a build on my " },
  { match: /^\/audio/, label: "Get audio quote", message: "Hi Riderzpro, I want an audio system for my " },
  { match: /^\/ppf/, label: "Book detailing", message: "Hi Riderzpro, I want to book PPF / detailing for my " },
  { match: /^\/off-road/, label: "Build my 4x4", message: "Hi Riderzpro, I want to build my off-road SUV: " },
  { match: /^\/garage/, label: "Book installation", message: "Hi Riderzpro, I want to book a workshop appointment for " },
  { match: /^\/body-kits/, label: "Get facelift quote", message: "Hi Riderzpro, I want a facelift quote for my " },
  { match: /^\/interiors/, label: "Design my interior", message: "Hi Riderzpro, I want to redo the interior of my " },
  { match: /^\/performance/, label: "Talk performance", message: "Hi Riderzpro, I want more power from my " },
];

export function WhatsAppFab() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctx = CONTEXT.find((c) => c.match.test(pathname));
  const label = ctx?.label ?? "Chat with us";
  const message = ctx?.message ?? "Hi Riderzpro, I have a question about ";

  return (
    <a
      href={whatsapp(message)}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${label} on WhatsApp`}
      className={`fixed bottom-[76px] right-4 z-50 flex h-13 items-center gap-2 rounded-full bg-[#1faa53] pl-3.5 pr-4 py-3 font-display text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_40px_-12px_rgba(31,170,83,0.85)] transition-all duration-300 lg:bottom-6 lg:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <Icon name="whatsapp" size={19} />
      <span className="hidden xs:inline">{label}</span>
    </a>
  );
}
