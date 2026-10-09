"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { whatsapp } from "@/lib/data/site";

/**
 * REQUEST RIDERZPRO INSPECTION.
 *
 * Creates a lead. It does not, and must not, change the listing's verification
 * state — only a completed workshop inspection does that.
 */
export function InspectionRequest({ vehicle, city }: { vehicle: string; city: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(city);
  const [date, setDate] = useState("");

  const ready = name.trim().length > 1 && phone.trim().length >= 10;

  const message = [
    "Hi Riderzpro, I'd like to request an inspection.",
    `Vehicle: ${vehicle}`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Location: ${location}`,
    `Preferred date: ${date || "flexible"}`,
  ].join("\n");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-block">
        <Icon name="shield" size={15} />
        Request Riderzpro inspection
      </button>
    );
  }

  return (
    <form
      className="border border-tint/10 bg-tint/3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) window.open(whatsapp(message), "_blank", "noopener,noreferrer");
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-extrabold uppercase">Request an inspection</p>
          <p className="mt-1 text-xs text-ash">
            One of our engineers checks the car on 12 points and sends you the report before you commit.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-dim hover:text-chalk">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="insp-name">
            Name
          </label>
          <input id="insp-name" required className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="insp-phone">
            Phone
          </label>
          <input
            id="insp-phone"
            required
            inputMode="tel"
            placeholder="+91"
            className="field tnum"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="insp-loc">
            Location
          </label>
          <input id="insp-loc" className="field" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="insp-date">
            Preferred date
          </label>
          <input id="insp-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!ready}
        className={`btn btn-block mt-4 ${ready ? "btn-whatsapp" : "btn-outline cursor-not-allowed opacity-40"}`}
      >
        <Icon name="whatsapp" size={16} />
        Send inspection request
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-dim">
        Vehicle: {vehicle}. Requesting an inspection does not mark this car as verified — the badge is
        only added after our engineer has physically checked it.
      </p>
    </form>
  );
}
