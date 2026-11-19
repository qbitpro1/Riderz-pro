"use client";

import { useGarage } from "@/lib/client/garage";
import { Icon } from "@/components/ui/Icon";
import { findModelBySlug } from "@/lib/data/vehicles";
import { EnquiryButton } from "@/components/enquiry/Enquiry";

/** Fitment as the data states it: universal, a model list, or "confirmed with you before dispatch". */
export function FitsYourCar({ fitment, title, code }: { fitment: string[]; title: string; code: string | null }) {
  const garage = useGarage();

  const universal = fitment.includes("universal");
  const models = fitment
    .filter((s) => s !== "universal")
    .map((s) => ({ slug: s, model: findModelBySlug(s) }));
  const ask = (
    `Hi Riderzpro, will ${title}${code ? ` (${code})` : ""} fit my car?${garage ? ` I drive a ${garage.label}.` : ""}`
  );
  const link = "text-accent underline underline-offset-2 min-h-0 p-0";

  return (
    <section className="border border-tint/8 bg-tint/2 p-4 md:p-5">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.08em]">
        <Icon name="car" size={16} className="text-accent" />
        Fits your car?
      </h2>

      {fitment.length === 0 ? (
        <p className="mt-2 text-sm text-ash">
          Fitment for this product is confirmed with you before we dispatch it.{" "}
          <EnquiryButton topic="fitment" title="Will it fit my car?" message={ask} className={link}>
            Check your car
          </EnquiryButton>
        </p>
      ) : (
        <>
          {universal && <p className="mt-2 text-sm text-ash">Listed as universal, so it is not tied to one model.</p>}
          {models.length > 0 && (
            <>
              <p className="mt-2 text-sm text-ash">Listed for:</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {models.map(({ slug, model }) => (
                  <li key={slug} className="chip">
                    {model ? `${model.brand} ${model.name}` : slug}
                  </li>
                ))}
              </ul>
            </>
          )}
          {garage && !universal && models.length > 0 &&
            (models.some((m) => m.slug === garage.modelSlug) ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-accent">
                <Icon name="check" size={14} />
                Fits your {garage.label}
              </p>
            ) : (
              <p className="mt-3 text-sm text-ash">
                Not listed for your {garage.label}.{" "}
                <EnquiryButton topic="fitment" title="Will it fit my car?" message={ask} className={link}>
                  Ask us
                </EnquiryButton>
              </p>
            ))}
        </>
      )}
    </section>
  );
}
