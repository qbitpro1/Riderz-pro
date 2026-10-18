# Viswanath: maps, routes and addresses (live tracking)

Updated 18 Oct 2026. Live tracking works today on free public services (OpenStreetMap tiles, the
public OSRM demo router with a straight-line fallback, Nominatim for addresses). Their usage rules
don't allow heavy production use, so choose providers before traffic grows.

## Before launch (must do)

1. **Contact email for OpenStreetMap services.** Their policy requires one. Today it says
   `contact: TBD` (`USER_AGENT` in `src/lib/server/tracking-geo.ts`); send the address and the
   developer sets it.
2. **Map tiles provider** (MapTiler, Stadia Maps or Carto have free tiers): put the tile address,
   with its key, in `NEXT_PUBLIC_MAP_TILES_URL`, e.g.
   `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=…`. Restrict the key to riderzpro.com in
   the provider's dashboard (this key is public by design).

## Decisions (today's behaviour in brackets)

- Routing [public OSRM demo, straight-line ETA if it fails]: a hosted or own OSRM server in
  `ROUTING_BASE_URL`, or keep the straight-line ETA.
- Address lookup [Nominatim, once per order without GPS]: keep, or choose a provider.
- Rider consent text ["Riderzpro shares your location with the customer only while you are
  delivering their order."].
- What customers see [rider's first name and vehicle; the rider on the map only after pickup; no
  phone number].

## When done

Tell the developer. They switch the settings on staging and test tracking on two real phones.
