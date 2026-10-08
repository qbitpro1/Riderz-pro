"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { whatsapp } from "@/lib/data/site";
import { DEALER_TARGET_REGIONS } from "@/lib/inventory/network";

const CITIES = DEALER_TARGET_REGIONS.flatMap((r) => r.cities);

const SUPPLIER_TYPES = [
  { value: "DEALER_PARTNER", label: "Used-car dealer" },
  { value: "MANUFACTURER_CERTIFIED", label: "Franchise / certified pre-owned dealer" },
  { value: "FLEET_PARTNER", label: "Fleet, rental or leasing company" },
  { value: "AUCTION_PARTNER", label: "Auction or wholesale" },
];

const INVENTORY_SYSTEMS = [
  "Excel or Google Sheets",
  "A dealer management system (DMS)",
  "Our own website",
  "Pen and paper",
  "Something else",
];

/** Dealer recruitment form. Produces a lead for the onboarding team. */
export function PartnerSignup() {
  const [business, setBusiness] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [city, setCity] = useState("Delhi");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [type, setType] = useState(SUPPLIER_TYPES[0].value);
  const [stock, setStock] = useState("");
  const [system, setSystem] = useState(INVENTORY_SYSTEMS[0]);
  const [agreed, setAgreed] = useState(false);

  const ready = business.trim() && contact.trim() && phone.trim().length >= 10 && city && agreed;

  const message = [
    "Hi Motorbotz, I'd like to list my inventory.",
    `Business: ${business}`,
    `Contact: ${contact}`,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : "",
    gstin ? `GSTIN: ${gstin}` : "",
    `Type: ${SUPPLIER_TYPES.find((t) => t.value === type)?.label}`,
    `City: ${city}`,
    address ? `Address: ${address}` : "",
    website ? `Website: ${website}` : "",
    stock ? `Cars in stock: ${stock}` : "",
    `Inventory system: ${system}`,
    "I accept the Motorbotz Inventory Agreement.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <form
      id="register"
      className="card scroll-mt-24 p-5 md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) window.open(whatsapp(message), "_blank", "noopener,noreferrer");
      }}
    >
      <p className="eyebrow mb-1">Become a partner</p>
      <h3 className="display-3">LIST YOUR CARS ON MOTORBOTZ</h3>
      <p className="mt-2 text-sm text-ash">
        Free to join, no card, no lock-in. We come back within one working day with your login and
        an upload link.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Business name" id="p-business" required>
          <input id="p-business" required className="field" value={business} onChange={(e) => setBusiness(e.target.value)} />
        </Field>
        <Field label="Contact person" id="p-contact" required>
          <input id="p-contact" required className="field" value={contact} onChange={(e) => setContact(e.target.value)} />
        </Field>
        <Field label="Phone" id="p-phone" required>
          <input
            id="p-phone"
            required
            inputMode="tel"
            placeholder="+91"
            className="field tnum"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Email" id="p-email">
          <input id="p-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="GSTIN" id="p-gstin">
          <input
            id="p-gstin"
            className="field uppercase"
            placeholder="29AAJCM4412Q1ZP"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Business type" id="p-type">
          <select id="p-type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {SUPPLIER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City" id="p-city">
          <select id="p-city" className="field" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
            <option>Other</option>
          </select>
        </Field>
        <Field label="Cars in stock" id="p-stock">
          <input
            id="p-stock"
            inputMode="numeric"
            className="field tnum"
            placeholder="40"
            value={stock}
            onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label="Address" id="p-address">
          <input id="p-address" className="field" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Website" id="p-website">
          <input id="p-website" className="field" placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="How do you keep your stock list today?" id="p-system">
          <select id="p-system" className="field" value={system} onChange={(e) => setSystem(e.target.value)}>
            {INVENTORY_SYSTEMS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 border border-white/10 bg-white/3 p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        />
        <span className="text-xs leading-relaxed text-ash">
          I accept the <span className="text-chalk">Motorbotz Inventory Agreement</span>: the vehicles
          and photographs I upload are mine to supply, and Motorbotz may display them while they are
          in my stock. I understand that Motorbotz Inspected and Motorbotz Verified are awarded by
          Motorbotz after a physical inspection and cannot be set by me.
        </span>
      </label>

      <button
        type="submit"
        disabled={!ready}
        className={`btn btn-block mt-5 ${ready ? "btn-whatsapp" : "btn-outline cursor-not-allowed opacity-40"}`}
      >
        <Icon name="whatsapp" size={16} />
        List my inventory
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
    </div>
  );
}
