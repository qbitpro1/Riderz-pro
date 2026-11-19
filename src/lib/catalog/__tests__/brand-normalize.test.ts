import { describe, expect, it } from "vitest";
import { brandCounts, brandText, normalizeBrand } from "../brand-normalize";

const HOUSE = [
  { slug: "riderzpro", name: "Riderzpro" },
  { slug: "recoil", name: "RECOIL" },
  { slug: "blaupunkt", name: "Blaupunkt" },
];

describe("brandText", () => {
  it("trims, lower-cases and collapses spaces", () => {
    expect(brandText("  Recoil   Audio ")).toBe("recoil audio");
  });
});

describe("normalizeBrand", () => {
  it("files a seller's spelling of a house brand under the house slug", () => {
    for (const raw of ["RECOIL", "recoil", " Recoil ", "ReCoIl"]) {
      expect(normalizeBrand(raw, HOUSE)).toEqual({ key: "recoil", name: "RECOIL" });
    }
  });

  it("matches a house brand by slug as well as by name", () => {
    expect(normalizeBrand("riderzpro", HOUSE).key).toBe("riderzpro");
  });

  it("gives other brands one stable marketplace key whatever the spacing or case", () => {
    const a = normalizeBrand("Bosch India", HOUSE);
    const b = normalizeBrand("  bosch   INDIA ", HOUSE);
    expect(a.key).toBe("mp-bosch-india");
    expect(b.key).toBe(a.key);
    expect(b.name).toBe("bosch INDIA");
  });

  it("keeps the old marketplace key format so existing ?brand= links still work", () => {
    expect(normalizeBrand("Pioneer & Co.", HOUSE).key).toBe("mp-pioneer-co");
  });

  it("never returns an empty key", () => {
    expect(normalizeBrand("   ", HOUSE).key).toBe("mp-brand");
  });

  it("uses the real house brand list by default", () => {
    expect(normalizeBrand(" recoil ").key).toBe("recoil");
  });
});

describe("brandCounts", () => {
  it("counts each normalized brand once, most products first", () => {
    const items = [
      ...Array.from({ length: 37 }, () => ({ brand: "recoil", brandName: "RECOIL" })),
      // a seller's RECOIL speakers, which used to show as a second "RECOIL" (mp-recoil, 6)
      ...Array.from({ length: 6 }, () => ({ brand: normalizeBrand("Recoil", HOUSE).key, brandName: "RECOIL" })),
      { brand: "riderzpro", brandName: "Riderzpro" },
      { brand: "riderzpro", brandName: "Riderzpro" },
    ];
    expect(brandCounts(items)).toEqual([
      { key: "recoil", name: "RECOIL", count: 43 },
      { key: "riderzpro", name: "Riderzpro", count: 2 },
    ]);
  });
});
