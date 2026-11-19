"use client";

import { recordLead } from "@/lib/client/leads";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { whatsapp } from "@/lib/data/site";
import { APPOINTMENT_SERVICES } from "@/lib/data/services";

export function BookingForm({ defaultService }: { defaultService?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [service, setService] = useState(defaultService ?? APPOINTMENT_SERVICES[0]);
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const ready = name.trim() && phone.trim().length >= 10 && car.trim();

  const message = [
    "Hi Riderzpro, I'd like to book an appointment.",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Car: ${car}`,
    `Service: ${service}`,
    `Preferred date: ${date || "flexible"}`,
    city.trim() ? `City: ${city.trim()}` : "",
    notes ? `Notes: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <form
      className="card p-5 md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        window.open(whatsapp(message), "_blank", "noopener,noreferrer");
        recordLead("garage_booking", { name, phone, city: city.trim() || undefined, details: { car, service, date: date || "flexible", notes } }, message);
      }}
    >
      <p className="eyebrow mb-1">Riderzpro Garage</p>
      <h3 className="display-3">BOOK AN APPOINTMENT</h3>
      <p className="mt-2 text-sm text-ash">
        Tell us what the car needs. We confirm a slot on WhatsApp within business hours.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Name" id="bk-name">
          <input id="bk-name" required className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Phone" id="bk-phone">
          <input
            id="bk-phone"
            required
            inputMode="tel"
            className="field tnum"
            placeholder="+91"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Your car" id="bk-car">
          <input
            id="bk-car"
            required
            className="field"
            placeholder="2022 Mahindra Thar LX 4x4"
            value={car}
            onChange={(e) => setCar(e.target.value)}
          />
        </Field>
        <Field label="Service required" id="bk-service">
          <select id="bk-service" className="field" value={service} onChange={(e) => setService(e.target.value)}>
            {APPOINTMENT_SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Preferred date" id="bk-date">
          <input id="bk-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Your city" id="bk-city">
          <input id="bk-city" className="field" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Anything else we should know?" id="bk-notes">
          <textarea
            id="bk-notes"
            rows={3}
            className="field py-3"
            style={{ minHeight: "5rem" }}
            placeholder="Budget, deadline, reference photos, existing modifications..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>

      <button
        type="submit"
        className={`btn btn-block mt-5 ${ready ? "btn-whatsapp" : "btn-outline cursor-not-allowed opacity-40"}`}
        disabled={!ready}
      >
        <Icon name="whatsapp" size={16} />
        Request this slot
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
