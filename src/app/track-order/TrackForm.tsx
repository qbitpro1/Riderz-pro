"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EnquiryButton } from "@/components/enquiry/Enquiry";

export function TrackForm() {
  const [ref, setRef] = useState("");
  const value = ref.trim();
  const message = value
    ? `Hi Riderzpro, where is my order? Order reference / phone: ${value}`
    : "Hi Riderzpro, where is my order?";

  return (
    <div className="card p-6">
      <label htmlFor="order-ref" className="label">
        Order reference or phone number (optional)
      </label>
      <input
        id="order-ref"
        className="field mt-2"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        autoComplete="off"
      />
      <EnquiryButton topic="order" title="Where is my order?" message={message} className="btn btn-primary btn-block mt-4">
        <Icon name="search" size={16} />
        Ask about my order
      </EnquiryButton>
      <p className="mt-3 text-xs text-dim">
        Signed in? Your orders and their live tracking are under{" "}
        <Link href="/account/orders" className="underline hover:text-accent">
          My orders
        </Link>
        .
      </p>
    </div>
  );
}
