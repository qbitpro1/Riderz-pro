# AI assistant (person: to be assigned by the owner)

Written 18 Oct 2026. The website assistant (`/assistant`) and the shop screen's AI salesperson are
built and tested with a local stand-in. They stay switched off ("not switched on yet") until this is done.

**How to send secrets:** never in chat, email, WhatsApp or git. Type them into the hosting dashboard.

## 1. Anthropic (Claude) API key

- [ ] Create an organisation at console.anthropic.com in the company's name, with billing.
- [ ] Set a **monthly spend limit** there.
- [ ] Create an API key for "Riderzpro website" and set it as `ANTHROPIC_API_KEY` (production only;
      a separate key for staging).
- [ ] Optional: `ASSISTANT_MODEL` (default `claude-sonnet-5-5`; `claude-haiku-5-5` is cheaper and faster).
- [ ] Optional caps: `ASSISTANT_DAILY_LIMIT` (website, default 3,000 questions a day) and
      `STORE_ASSISTANT_DAILY_LIMIT` (per shop screen, default 800 a day).

## 2. Decisions

- [ ] Privacy policy: add that shoppers' questions to the assistant are processed by Anthropic to answer
      them (no names or phone numbers are sent; the shop screen never asks the AI for them).
- [ ] Bargaining is off by default for each seller; each seller sets their own limit (most 30%).
      Should Riderzpro cap it lower for everyone?

## When done

Tell the owner. The developer then runs the same tests against the real model and checks the
answers in English and Hindi.
