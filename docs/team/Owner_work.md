# Owner: accounts and decisions only the owner can make

Updated 18 Oct 2026.

## Before launch

1. **AI assistants (Claude API).**
   - Create an Anthropic organisation at console.anthropic.com in the company's name, with billing
     and a monthly spend limit.
   - Give Hema the API key for `ANTHROPIC_API_KEY`.
   - Optional: `ASSISTANT_MODEL` (default `claude-sonnet-5-5`; `claude-haiku-5-5` is cheaper).
   - Optional daily caps: `ASSISTANT_DAILY_LIMIT` (default 3,000), `STORE_ASSISTANT_DAILY_LIMIT`
     (default 800 per shop).
   - Without the key, both assistants show as "not switched on yet" and everything else works.
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
