# Viswanath: maps, routes and addresses for live tracking

Written 17 Oct 2026. Phase 3 is built and tested on the free public services below, so **building does
not wait**. Their usage rules forbid heavy production use, so before go-live a decision is needed.

| Need | Used in development | Production choice needed |
| --- | --- | --- |
| Map pictures (tiles) | OpenStreetMap's own tile server | MapTiler, Stadia Maps or Carto (free tiers exist) and its key |
| Road route and ETA | Public OSRM demo server, with a straight-line fallback | OpenRouteService key, or our own OSRM server, or straight-line ETA only |
| Address from GPS ("Detect my location" at checkout) | OpenStreetMap Nominatim (max 1 lookup a second) | Fine for low volume; for more, LocationIQ / MapTiler geocoding key |

## Please decide

Phase 3 is now built (17 Oct 2026). The settings it reads:

| Setting | What goes in it | Default today |
| --- | --- | --- |
| `NEXT_PUBLIC_MAP_TILES_URL` | The tile address from the chosen provider, with its key inside, e.g. `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=…` (public by design: restrict the key to riderzpro.com in the provider's dashboard) | OpenStreetMap's own tiles |
| `ROUTING_BASE_URL` | An OSRM-compatible routing server (our own, or a hosted one) | Public OSRM demo server |

- [ ] Tiles provider and the tile address above.
- [ ] Routing: a hosted or own OSRM server, or "straight-line ETA is fine" (it already falls back to that).
- [ ] Geocoding: keep Nominatim (fine for low volume; it is only used once per order without GPS),
      or choose a provider; tell the developer and it will be added.
- [ ] A contact email for OpenStreetMap services. Their policy needs one in our app's identity:
      today it says `contact: TBD` (`USER_AGENT` in `src/lib/server/tracking-geo.ts`).

## Policy wording (owner)

- [ ] The rider's consent text. Today: "Riderzpro shares your location with the customer only while
      you are delivering their order." (`LOCATION_CONSENT_TEXT` in `src/lib/tracking/geo.ts`).
- [ ] Customers see the rider's first name and vehicle, and the rider on the map only after pickup
      (not while the rider is going to the seller). Confirm, or say what to change.
- [ ] Whether customers may call the rider (today: no phone number is shown; a masked call option
      would need a calling provider).
