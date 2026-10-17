# Viswanath: maps, routes and addresses for live tracking

Written 17 Oct 2026. Phase 3 is built and tested on the free public services below, so **building does
not wait**. Their usage rules forbid heavy production use, so before go-live a decision is needed.

| Need | Used in development | Production choice needed |
| --- | --- | --- |
| Map pictures (tiles) | OpenStreetMap's own tile server | MapTiler, Stadia Maps or Carto (free tiers exist) and its key |
| Road route and ETA | Public OSRM demo server, with a straight-line fallback | OpenRouteService key, or our own OSRM server, or straight-line ETA only |
| Address from GPS ("Detect my location" at checkout) | OpenStreetMap Nominatim (max 1 lookup a second) | Fine for low volume; for more, LocationIQ / MapTiler geocoding key |

## Please decide

- [ ] Tiles provider, and send its key as `NEXT_PUBLIC_MAP_TILES_KEY` (this key is public by design;
      restrict it to riderzpro.com in the provider's dashboard).
- [ ] Routing: provider and key as `ROUTING_API_KEY` (server only), or "straight-line ETA is fine".
- [ ] Geocoding: keep Nominatim for now, or a provider and key as `GEOCODING_API_KEY` (server only).
- [ ] A contact email to identify our app to OpenStreetMap services (their policy asks for one).

## Policy wording (owner)

- [ ] The rider's consent text, e.g. "Riderzpro shares your location with the customer only while you
      are delivering their order."
- [ ] Whether customers see the rider's name and phone number, or only the name with a masked call option.

The env names above are what the developer plans to use; the final names will be confirmed in
`.env.example` when Phase 3 is built.
