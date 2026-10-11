# Turning on Shopify checkout

This site is already wired for Shopify. Until you finish the steps below, the cart keeps working exactly as it does today: customers press "Confirm order on WhatsApp". When you finish, customers get a "Checkout securely" button that opens Shopify's hosted checkout, and "Confirm order on WhatsApp" stays as a second option.

Shopify's screens and wording change from time to time. Where this guide is not sure of an exact label, it says "check Shopify's current docs" (help.shopify.com).

## How it fits together

- The website stays as it is. Shopify only handles the cart, payment and the order record.
- Each product on the site is matched to the same product in Shopify by its **handle**. The handle is the last part of the product's web address on this site (`/products/<handle>`). The CSV file this site produces fills the handle in for you. **Never change a handle in Shopify**, or the cart will no longer find that product.
- Prices come from Shopify at checkout, never from the browser. If a price in Shopify differs from the website, Shopify's price is what the customer pays.

## Step 1 - Create the Shopify store

1. Sign up at shopify.com and create the store. Note its permanent address, which looks like `your-store.myshopify.com` (find it under Settings, Domains; check Shopify's current docs if the screen has moved).
2. Set the store currency to INR and enter your business details, GST registration and shipping origin.
3. Set up shipping rates and tax settings to match what you charge on the site (the site currently shows free shipping over a threshold, and prices include GST). Check Shopify's current docs for how "prices include tax" works for India.

## Step 2 - Payments

1. In Shopify's payment settings, activate a payment provider that supports India. Shopify's own payments product is not available in every country and its availability can change, so check Shopify's current docs for what is offered to you. Third-party Indian gateways (for example Razorpay, PayU, Cashfree and others) are available through Shopify's payment provider list.
2. Typically these providers can offer UPI, cards and net banking. Cash on delivery is a separate manual payment method in Shopify; whether to offer it is your decision. Fees and approval times differ by provider, so read each provider's current terms.
3. Place a test order in test or bogus-gateway mode before taking real payments (see Step 7).

## Step 3 - Storefront API access token

The website talks to Shopify through the Storefront API.

1. In the Shopify admin, create the access for a custom storefront. Shopify has called this the **Headless** sales channel, and it can also be done by creating an app in Settings, Apps and sales channels. Check Shopify's current docs for the current path.
2. Give the Storefront API permissions for: reading products and product listings (including product inventory and variant details), and for creating and managing carts / checkouts. In Shopify's list these are labelled along the lines of "unauthenticated_read_product_listings", "unauthenticated_read_product_inventory" and "unauthenticated_write_checkouts" (and "unauthenticated_read_checkouts"). Exact names can differ, so choose the equivalents that Shopify shows.
3. Copy the **Storefront API access token** (the "public" token for the Storefront API is fine here; the website only uses it on the server). Do not share it in email or chat; paste it only into your hosting dashboard.

## Step 4 - Import the products

1. Sign in to this site's admin page: `/admin/shopify` (it asks for the admin username and password, see Step 5). It shows how many products and variants will be exported and which products are skipped and why.
2. Click "Download Shopify products CSV".
3. In the Shopify admin go to Products, Import, and upload the file. Check Shopify's current docs for the product CSV format and file size limits; if the file is too large, split it by rows (keep all rows of one product together).
4. After the import, spot-check a few products: title, price, options (for example seat-cover rows and colours) and images.

Notes about the file:

- One row per variant (every allowed combination of options). Combinations with a value we have no price for are left out.
- Products without a price ("price on request") and products held back from the site are not exported.
- Stock quantities are included only for products that have no options. Set quantities for the others inside Shopify.
- The file contains no dealer price or cost.
- Images are linked from their current web addresses; Shopify downloads them during the import.
- Products are imported as active. If you would rather review first, change the Status column to `draft` before importing.

## Step 5 - Set the environment variables

Set these in your hosting dashboard (and in `.env.local` for local work). `.env.example` lists them all.

| Name | Value |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | the token from Step 3 |
| `SHOPIFY_API_VERSION` | optional; Shopify's current stable Storefront API version, written like `2025-07`. The site's built-in default is only a placeholder, so please set this to the current version shown in Shopify's docs when you create the store, and revisit it every few months. |
| `ADMIN_USER`, `ADMIN_PASSWORD` | a username and a long, unique password for the `/admin` pages. In production the admin pages return "not found" until both are set. |
| `NEXT_PUBLIC_SHOPIFY_CHECKOUT` | leave empty for now; see Step 6 |

Redeploy after changing environment variables. Then open `/admin/shopify`: the first card should say "Configured".

## Step 6 - Turn checkout on

Set `NEXT_PUBLIC_SHOPIFY_CHECKOUT=1` and redeploy (this value is baked in when the site is built, so a redeploy is required). The cart now shows "Checkout securely" first and "Confirm order on WhatsApp" second. To switch back, clear the variable and redeploy.

## Step 7 - Test with one product

1. Before turning the flag on for everyone, use a preview or local copy with the flag set, or temporarily make only one product active in Shopify.
2. Add that product (and, if it has options, a specific option combination) to the cart and press "Checkout securely".
3. You should land on Shopify's checkout showing the same product, option and quantity. Complete a test order using the payment provider's test mode (check the provider's docs; Shopify also offers a bogus test gateway on development stores).
4. Check the order appears in the Shopify admin, then cancel or refund it as a test.
5. If the button says online checkout is unavailable, the likely causes are: the handle in Shopify differs from the site's, the option names or values differ from the site's, the product is not available for sale in Shopify, or the token lacks permissions.

## What stays manual for now

- **Stock:** quantities are not synced. The website does not read Shopify's stock; Shopify only stops selling a variant that it marks as unavailable.
- **Price changes:** edit them in Shopify and also on the site data, so the product page matches what checkout charges. The cart on the site shows its own prices; the checkout uses Shopify's.
- **Order status and fulfilment:** managed in the Shopify admin. Customers get Shopify's order emails.
- **Fitment confirmation:** the old WhatsApp flow let you confirm fitment before payment. With online checkout, orders can be paid without that check, so decide how you will handle fitment questions (for example a phone call after the order).
- **`/api/dealer`:** this part of the site is not protected by the admin login. It is outside this setup; have it reviewed separately.

## Natural next steps

- Sync inventory and prices from Shopify back to the site, so the pages never disagree with checkout.
- Shopify webhooks, for example to update order status or notify you on WhatsApp when an order is paid.
- Customer accounts and order history (Shopify has a Customer Account API; check its current docs).
- Discount codes, shipping rules and abandoned-cart emails inside Shopify.
