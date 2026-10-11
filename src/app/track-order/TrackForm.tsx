"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { whatsapp } from "@/lib/data/site";

export function TrackForm() {
  const [ref, setRef] = useState("");
  const value = ref.trim();
  const message = value
    ? `Hi Riderzpro, where is my order? Order reference / phone: ${value}`
    : "Hi Riderzpro, where is my order?";

  return (
    <form
      className="card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        window.open(whatsapp(message), "_blank", "noopener,noreferrer");
      }}
    >
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
      <button type="submit" className="btn btn-whatsapp btn-block mt-4">
        <Icon name="whatsapp" size={16} />
        Ask on WhatsApp
      </button>
      <p className="mt-3 text-xs text-dim">This opens WhatsApp with a message ready to send. Nothing is sent until you send it.</p>
    </form>
  );
}
