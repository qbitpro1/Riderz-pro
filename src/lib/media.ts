/**
 * Curated automotive photography library.
 *
 * Every asset is served from the Unsplash CDN and re-encoded by the Next.js
 * image pipeline into AVIF/WebP at the exact width each breakpoint needs, so
 * the mobile experience never downloads a desktop-sized frame.
 */

export type Photo = { src: string; alt: string };

const CDN = "https://images.unsplash.com/";

const photo = (id: string, alt: string): Photo => ({ src: `${CDN}${id}`, alt });

export const MEDIA = {
  // --- Cinematic / night -----------------------------------------------
  heroWorkshopNight: photo(
    "photo-1626668893632-6f3a4466d22f",
    "Blacked-out build lit by workshop floodlights inside the Riderzpro bay at night",
  ),
  garageHeadlights: photo(
    "photo-1533106418989-88406c7cc8ca",
    "Performance car with headlights blazing inside a dark parking structure",
  ),
  garageSpotlit: photo(
    "photo-1492144534655-ae79c964c9d7",
    "Coupe under dramatic overhead lighting in a dark workshop",
  ),
  cityNightRain: photo(
    "photo-1517672651691-24622a91b550",
    "Modified car on a wet city street at night",
  ),
  nightStreetSedan: photo(
    "photo-1568844293986-8d0400bd4745",
    "Performance sedan parked under city lights at night",
  ),

  // --- Off-road / SUV ---------------------------------------------------
  defenderSaltFlat: photo(
    "photo-1502489597346-dad15683d4c2",
    "Lifted 4x4 with roof rack crossing an open salt flat at sunrise",
  ),
  suvDesertRocks: photo(
    "photo-1533473359331-0135ef1b58bf",
    "Full-size SUV parked among red desert rock formations",
  ),
  suvSnowRoad: photo(
    "photo-1519641471654-76ce0107ad1b",
    "SUV on a snow-lined mountain road",
  ),
  suvGrille: photo(
    "photo-1621993202323-f438eec934ff",
    "Aggressive front grille of an off-road SUV",
  ),
  suvDesertTrail: photo(
    "photo-1600661653561-629509216228",
    "White SUV on an open desert trail",
  ),
  wagonRoofBox: photo(
    "photo-1626072778346-0ab6604d39c4",
    "Lowered estate fitted with a roof box and aftermarket wheels",
  ),
  awdSnow: photo(
    "photo-1517524008697-84bbe3c3fd98",
    "All-wheel-drive saloon on a snow-covered road",
  ),

  // --- Workshop / service ----------------------------------------------
  detailingPolish: photo(
    "photo-1552642986-ccb41e7059e7",
    "Detailer machine-polishing a panel under inspection lighting",
  ),
  wrapHeatGun: photo(
    "photo-1558618666-fcd25c85cd64",
    "Installer heat-forming protective film over a body panel",
  ),
  mechanicEngine: photo(
    "photo-1487754180451-c456f719a1fc",
    "Technician working on an engine bay inside the Riderzpro garage",
  ),
  washBay: photo(
    "photo-1590362891991-f776e747a588",
    "Car moving through a lit decontamination wash bay",
  ),
  engineBay: photo(
    "photo-1486262715619-67b85e0b08d3",
    "Close detail of a turbocharged engine bay",
  ),
  exhaustSpray: photo(
    "photo-1520340356584-f9917d1eea6f",
    "Rear quarter of a performance car throwing spray from the exhaust",
  ),

  // --- Interior / audio -------------------------------------------------
  cockpitScreen: photo(
    "photo-1610647752706-3bb12232b3ab",
    "SUV cabin with a large vertical infotainment screen and premium trim",
  ),
  steeringNight: photo(
    "photo-1449965408869-eaa3f722e40d",
    "Driver's hands on a custom steering wheel at night",
  ),
  studioMonitors: photo(
    "photo-1545454675-3531b543be5d",
    "Reference monitors used to tune Riderzpro audio builds",
  ),
  speakerCone: photo(
    "photo-1558537348-c0f8e733989d",
    "Close-up of a speaker cone and rubber surround",
  ),
  speakerEnclosure: photo(
    "photo-1608043152269-423dbba4e7e1",
    "Matte black speaker enclosure",
  ),

  // --- Lighting / detail ------------------------------------------------
  tailLightBokeh: photo(
    "photo-1493238792000-8113da705763",
    "LED tail lamp glowing against evening bokeh",
  ),
  frontGrilleRed: photo(
    "photo-1550355291-bbee04a92027",
    "Front grille and headlamp detail of a red hatchback",
  ),
  chromeGrille: photo(
    "photo-1544636331-e26879cd4d9b",
    "Polished grille and headlight assembly of a luxury car",
  ),
  taillightDusk: photo(
    "photo-1571607388263-1044f9ea01dd",
    "Rear wing and quad exhaust tips at dusk",
  ),

  // --- Cars ------------------------------------------------------------
  luxurySaloonMotion: photo(
    "photo-1503376780353-7e6692767b70",
    "Black luxury saloon captured in motion",
  ),
  coupeBlue: photo(
    "photo-1552519507-da3b142c6e3d",
    "Blue coupe parked on a gravel lot",
  ),
  openRoadRear: photo(
    "photo-1568605117036-5fe5e7bab0b7",
    "Rear three-quarter of a car on an open mountain road",
  ),
  crossoverTeal: photo(
    "photo-1541899481282-d53bffe3c35d",
    "Teal compact crossover photographed on a city street",
  ),
  muscleFront: photo(
    "photo-1494976388531-d1058494cdd8",
    "Blacked-out muscle coupe photographed head-on",
  ),
  sportSaloonBlue: photo(
    "photo-1502877338535-766e1452684a",
    "Blue sports saloon parked beside a concrete facade",
  ),
  coupeGrey: photo(
    "photo-1580273916550-e323be2ae537",
    "Grey performance coupe on a tree-lined avenue",
  ),
  estateRear: photo(
    "photo-1606664515524-ed2f786a0bd6",
    "Rear of a blacked-out performance estate",
  ),
  executiveSaloon: photo(
    "photo-1601362840469-51e4d8d58785",
    "Executive saloon with a large chrome grille",
  ),
  gtForest: photo(
    "photo-1553440569-bcc63803a83d",
    "Red grand tourer photographed on a forest road",
  ),
  gtYellow: photo(
    "photo-1605559424843-9e4c228bf1c2",
    "Yellow grand tourer parked at the coast",
  ),
  supercarRear: photo(
    "photo-1502161254066-6c74afbf07aa",
    "Rear three-quarter of a dark red supercar",
  ),
  muscleRoad: photo(
    "photo-1547744152-14d985cb937f",
    "Black muscle car photographed on an open road",
  ),
  trackYellow: photo(
    "photo-1503736334956-4c8f8e92946d",
    "Yellow sports car on a circuit",
  ),
  supercarForest: photo(
    "photo-1580414057403-c5f451f30e1c",
    "White supercar on a forest road",
  ),
  showroomRed: photo(
    "photo-1583121274602-3e2820c69888",
    "Red supercar under showroom lighting",
  ),
  parkYellow: photo(
    "photo-1511919884226-fd3cad34687c",
    "Yellow sports car parked in a city park",
  ),
} satisfies Record<string, Photo>;

export type MediaKey = keyof typeof MEDIA;

/**
 * Builds a CDN URL with explicit crop + quality so the optimiser never has to
 * pull a 4000px original just to emit a 400px card image.
 */
export function photoUrl(key: MediaKey, width = 1600, quality = 68): string {
  return `${MEDIA[key].src}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

export function photoAlt(key: MediaKey): string {
  return MEDIA[key].alt;
}
