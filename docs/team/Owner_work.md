# Owner: accounts and decisions only the owner can make

Updated 18 Oct 2026.

## Before launch

1. **Salesman AI Full mode (Claude API, optional).** Ask AI on the website is free and needs no
   key. Salesman AI on the shop screen works without the key in Basic mode (finds, compares and
   adds products, bargains 5% → 7% → 8% "last price" → 10% only if pushed, opens checkout, in
   English or Hinglish). The key turns on Full mode, which talks naturally. For the Indus pilot set
   `SALESMAN_FULL_AI_SHOPS=indus-enterprises` so only Indus uses (and costs) Claude.
   - Create an Anthropic organisation at console.anthropic.com in the company's name, with billing
     and a monthly spend limit.
   - Give Hema the API key for `ANTHROPIC_API_KEY`.
   - Optional: `ASSISTANT_MODEL` (default `claude-sonnet-5-5`; `claude-haiku-5-5` is cheaper).
   - Optional daily caps: `ASSISTANT_DAILY_LIMIT` (default 3,000), `STORE_ASSISTANT_DAILY_LIMIT`
     (default 800 per shop).
   - Optional: `WEB_ASSISTANT_ENGINE=claude` makes Ask AI use Claude too (it falls back to the free
     engine if Claude fails).
2. **Hero photos.** The site's stock photos load from Unsplash. For launch, replace the home page and
   department hero images with our own photos (they then load from our own server).

## Decisions

- **Bargaining cap:** each seller chooses theirs, up to 30% off an order [bargaining is off until a
  seller turns it on]. Should Riderzpro set a lower cap for everyone?
- Not built, waiting for you:
  - a header "Deliver to" picker (riders carry only marketplace sellers' parcels today);
  - customer reviews and warranty registration;
  - doorstep installation bookings;
  - a mobile app (rider app first).
