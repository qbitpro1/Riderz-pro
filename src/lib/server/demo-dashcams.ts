import "server-only";

/**
 * Qubo (Hero Electronix) dashcams for the demo store "Indus Enterprises".
 *
 * Source: https://www.quboworld.com/products/<slug> (Shopify storefront and its
 * /products.json), read on 17 Oct 2026. Names, MRP (compare-at price), selling price
 * (INR, GST inclusive), summaries and specification rows are as listed on the site;
 * anything the site does not state is left out. Photos are the manufacturer's own
 * product images, saved under public/demo/qubo/.
 *
 * Not included: sold-out listings (Dashcam Pro 4K Front, Dashcam Pro 3K Front STARVIS 2,
 * 3-Channel Trio, 3K [F+R] STARVIS), the "Dashcam Pro 3K" listing (no specification or
 * description on the site), combos, hardwiring kits and installation services.
 */

export type DemoDashcam = {
  title: string;
  brand: "Qubo";
  slug: string;
  /** Integer rupees, GST inclusive. */
  mrp: number;
  price: number;
  summary: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  /** Paths under /public. */
  images: string[];
  /** The product page on quboworld.com. */
  sourceUrl: string;
};

const SITE = "https://www.quboworld.com/products/";
const img = (slug: string, n: number, ext = "jpg") => `/demo/qubo/${slug}-${n}.${ext}`;

type Common = {
  resolution: string;
  pixels: string;
  fov: string;
  display?: string;
  power: string;
  wifi: string;
  rearCable?: string;
  extra?: { label: string; value: string }[];
};

/** The specification rows the site shows for every dashcam, in the site's order. */
function specs(c: Common): { label: string; value: string }[] {
  return [
    { label: "Video resolution", value: c.resolution },
    { label: "Sensor", value: c.pixels },
    { label: "Field of view", value: c.fov },
    { label: "Wide dynamic range (WDR)", value: "Yes" },
    { label: "Video format", value: "MP4" },
    { label: "Video encoding", value: "H.265" },
    { label: "Wi-Fi", value: c.wifi },
    ...(c.extra ?? []),
    { label: "G-sensor", value: "Yes" },
    ...(c.display ? [{ label: "Screen display", value: c.display }] : []),
    { label: "Speaker and mic", value: "Yes" },
    { label: "Power supply", value: c.power },
    { label: "Mounting", value: "Adhesive, detachable" },
    { label: "Front cable length", value: "3.5 m" },
    ...(c.rearCable ? [{ label: "Rear camera cable length", value: c.rearCable }] : []),
  ];
}

export const DEMO_DASHCAMS: DemoDashcam[] = [
  {
    title: "Dashcam Car Pro 2K",
    brand: "Qubo",
    slug: "pro-2k",
    mrp: 6990,
    price: 4290,
    summary: "2K resolution dashcam with supercapacitor and smart collision detection.",
    highlights: [
      "2K (2304 x 1296) recording, 120 degree field of view",
      "Wi-Fi and emergency recording",
      "Supports up to 1 TB SD card",
      "Supercapacitor and G-sensor collision detection",
      "360 degree rotation, detachable adhesive mount",
    ],
    specs: specs({
      resolution: "2K",
      pixels: "2304 x 1296 px",
      fov: "120°",
      wifi: "2.4 GHz",
      power: "5V 1A",
      display: "No screen",
      extra: [{ label: "Power backup", value: "Supercapacitor" }],
    }),
    images: [img("pro-2k", 1), img("pro-2k", 2), img("pro-2k", 3)],
    sourceUrl: `${SITE}dashcam-pro-2k`,
  },
  {
    title: "Dashcam Car Pro X 3MP",
    brand: "Qubo",
    slug: "pro-x-3mp",
    mrp: 5590,
    price: 3490,
    summary: "3MP FHD+ dashcam with supercapacitor and collision detection.",
    highlights: [
      "3MP FHD+ recording at 1296p (2304 x 1296), 30 fps",
      "120 degree field of view with WDR",
      "Supercapacitor (5.4V 2.5F) and G-sensor collision detection",
      "Wi-Fi 2.4 GHz, built-in speaker and mic",
      "360 degree rotation, detachable adhesive mount",
    ],
    specs: specs({
      resolution: "1296p (2304 x 1296) at 30 fps",
      pixels: "3MP",
      fov: "120°",
      wifi: "2.4 GHz",
      power: "5V 1A",
      display: "No screen",
      extra: [{ label: "Power backup", value: "Supercapacitor, 5.4V 2.5F" }],
    }),
    images: [img("pro-x-3mp", 1), img("pro-x-3mp", 2), img("pro-x-3mp", 3)],
    sourceUrl: `${SITE}dashcam-pro-x-3mp`,
  },
  {
    title: "DashCam Pro GPS",
    brand: "Qubo",
    slug: "pro-gps",
    mrp: 6690,
    price: 3790,
    summary: "Full HD dashcam with built-in GPS logging and 1TB storage support.",
    highlights: [
      "Full HD 1080p recording at 30 fps, 130 degree field of view",
      "Built-in GPS logging",
      "Supports up to 1 TB SD card",
      "Wi-Fi 2.4 GHz, G-sensor and WDR",
      "Built-in speaker and mic",
    ],
    specs: specs({
      resolution: "1920 x 1080 at 30 fps",
      pixels: "2MP",
      fov: "130°",
      wifi: "2.4 GHz",
      power: "5V 1A",
      display: "No screen",
      extra: [
        { label: "GPS", value: "Yes" },
        { label: "Battery", value: "240 mAh" },
      ],
    }),
    images: [img("pro-gps", 1), img("pro-gps", 2), img("pro-gps", 3)],
    sourceUrl: `${SITE}dashcam-pro-gps`,
  },
  {
    title: "Dashcam Pro 2K (Front + Rear)",
    brand: "Qubo",
    slug: "pro-2k-front-rear",
    mrp: 13990,
    price: 6490,
    summary: "2K front and 1080p rear dual-channel dashcam.",
    highlights: [
      "Dual channel: 2K (2304 x 1296) front, 1080p rear at 30 fps",
      "120 degree field of view on both cameras",
      "Supercapacitor and G-sensor collision detection",
      "WDR, built-in speaker and mic",
      "360 degree rotation, detachable adhesive mount",
    ],
    specs: specs({
      resolution: "Front 2K (2304 x 1296) at 30 fps, rear 1080p",
      pixels: "3MP",
      fov: "Front 120°, rear 120°",
      wifi: "Yes",
      power: "5V 2A",
      display: "No screen",
      extra: [{ label: "Power backup", value: "Supercapacitor" }],
    }),
    images: [img("pro-2k-front-rear", 1), img("pro-2k-front-rear", 2), img("pro-2k-front-rear", 3)],
    sourceUrl: `${SITE}dashcam-pro-2k-front-rear`,
  },
  {
    title: "Car Dash Cam Pro 2.7K 5MP QHD+ HDR (Front)",
    brand: "Qubo",
    slug: "pro-2-7k-front",
    mrp: 10990,
    price: 6490,
    summary: "2.7K Quad HD+ front dashcam with 2-inch LCD, HDR and up to 1 TB storage.",
    highlights: [
      "2.7K QHD+ (2880 x 1620) at 30 fps, 5MP",
      "Ultra-wide 140 degree field of view",
      "2 inch LCD display on the camera",
      "Built-in supercapacitor and G-sensor collision detection",
      "Supports up to 1 TB SD card",
    ],
    specs: specs({
      resolution: "1620p (2880 x 1620) at 30 fps",
      pixels: "4MP",
      fov: "H 113.9° / V 59.3° / D 140.4°",
      wifi: "2.4 GHz",
      power: "5V 2A",
      display: "2 inch, 240 x 320 LCD",
      extra: [
        { label: "GPS", value: "Yes" },
        { label: "Power backup", value: "Supercapacitor, 5.4V 2.5F" },
      ],
    }),
    images: [img("pro-2-7k-front", 1), img("pro-2-7k-front", 2, "png")],
    sourceUrl: `${SITE}dashcam-27k-front`,
  },
  {
    title: "Dashcam Car Pro 2.7K 2026 [F+R] 5MP HDR",
    brand: "Qubo",
    slug: "pro-2-7k-front-rear",
    mrp: 14990,
    price: 8990,
    summary: "QHD+ dual dashcam with 2-inch LCD display and 1TB storage.",
    highlights: [
      "2.7K Quad HD+ front with 1080p rear camera",
      "Front 140 degree, rear 120 degree field of view",
      "2 inch LCD display on the camera",
      "Built-in supercapacitor and G-sensor collision detection",
      "Supports up to 1 TB SD card",
    ],
    specs: specs({
      resolution: "Front 2.7K QHD+, rear 1080p (1920 x 1080) at 25 fps",
      pixels: "4MP",
      fov: "Front 140°, rear 120°",
      wifi: "2.4 GHz",
      power: "5V 2A",
      display: "2 inch, 240 x 320 LCD",
      rearCable: "7 m",
      extra: [
        { label: "GPS", value: "Yes" },
        { label: "Power backup", value: "Supercapacitor" },
      ],
    }),
    images: [img("pro-2-7k-front-rear", 1), img("pro-2-7k-front-rear", 2, "png")],
    sourceUrl: `${SITE}dashcam-27k-f-r`,
  },
  {
    title: "Dashcam Pro 3K [F+R] Sony STARVIS 2 IMX675",
    brand: "Qubo",
    slug: "pro-3k-front-rear",
    mrp: 21990,
    price: 12990,
    summary: "3K front and rear dashcam with a Sony STARVIS 2 sensor for superior night recording.",
    highlights: [
      "5MP 3K front camera with Sony STARVIS 2 sensor for night recording",
      "1080p rear camera at 25 fps",
      "140 degree field of view",
      "3.2 inch IPS display with navigation buttons",
      "Supercapacitor, G-sensor and GPS",
    ],
    specs: specs({
      resolution: "Front 3K, rear 1080p (1920 x 1080) at 25 fps",
      pixels: "5MP",
      fov: "140°",
      wifi: "2.4 GHz",
      power: "5V 2A",
      display: "3.2 inch IPS",
      rearCable: "7 m",
      extra: [
        { label: "GPS", value: "Yes" },
        { label: "Power backup", value: "Supercapacitor" },
      ],
    }),
    images: [img("pro-3k-front-rear", 1), img("pro-3k-front-rear", 2), img("pro-3k-front-rear", 3)],
    sourceUrl: `${SITE}dashcam-3k-f-r-starvis-2`,
  },
  {
    title: "Dashcam Pro 4K 2026 [F+R] Sony STARVIS IMX415",
    brand: "Qubo",
    slug: "pro-4k-front-rear",
    mrp: 22990,
    price: 13990,
    summary: "4K (2026 edition) ultra HD front and rear dashcam with supercapacitor and G-sensor.",
    highlights: [
      "8MP 4K front camera with Sony STARVIS IMX415 sensor",
      "1080p rear camera at 25 fps",
      "140 degree field of view",
      "3.16 inch IPS display with navigation buttons",
      "Supercapacitor, G-sensor and GPS",
    ],
    specs: specs({
      resolution: "Front 4K, rear 1080p (1920 x 1080) at 25 fps",
      pixels: "8MP",
      fov: "140°",
      wifi: "2.4 GHz",
      power: "5V 2A",
      display: "3.16 inch IPS",
      rearCable: "7 m",
      extra: [
        { label: "GPS", value: "Yes" },
        { label: "Power backup", value: "Supercapacitor" },
      ],
    }),
    images: [img("pro-4k-front-rear", 1), img("pro-4k-front-rear", 2, "png"), img("pro-4k-front-rear", 3)],
    sourceUrl: `${SITE}dashcam-4k-f-r`,
  },
  {
    title: "Dashcam 4G Live (with 1 year CloudPlay)",
    brand: "Qubo",
    slug: "4g-live",
    mrp: 15990,
    price: 6990,
    summary: "4G connected dashcam with live remote view and GPS tracking.",
    highlights: [
      "4G connected with live remote view",
      "GPS tracking",
      "Full HD 1080p recording at 30 fps, 130 degree field of view",
      "Supercapacitor and G-sensor collision detection",
      "Built-in speaker and mic, RGB status LED",
    ],
    specs: specs({
      resolution: "1920 x 1080 at 30 fps",
      pixels: "2MP",
      fov: "130°",
      wifi: "2.4 GHz",
      power: "5V 2A",
      extra: [
        { label: "GPS", value: "Yes" },
        { label: "Power backup", value: "Supercapacitor" },
        { label: "CloudPlay", value: "1 year included" },
      ],
    }),
    images: [img("4g-live", 1), img("4g-live", 2), img("4g-live", 3)],
    sourceUrl: `${SITE}dashcam-4g`,
  },
];

/** Department and group for dashcams in the house catalogue taxonomy (src/lib/data/taxonomy.ts). */
export const DASHCAM_DEPARTMENT = "multimedia";
export const DASHCAM_GROUP = "cameras";
