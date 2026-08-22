# Checkout, Payment & Paid Generation — Frontend Integration Guide

**Audience:** Unilake frontend team
**Last updated:** August 22, 2026
**Scope:** everything needed to take a user from *"my free preview is ready"* through *"I paid"* to *"I'm watching all 24 pages of my comic generate."* Ends at a stubbed **Send to Print** button.

**Source of truth** (paths are relative to the **backend** repo root):
[src/routes/public.ts](src/routes/public.ts), [src/routes/user.ts](src/routes/user.ts), [src/routes/webhooks.ts](src/routes/webhooks.ts), [src/services/checkout.service.ts](src/services/checkout.service.ts), [src/services/webhook.service.ts](src/services/webhook.service.ts), [src/services/session.service.ts](src/services/session.service.ts), [src/lib/razorpay.ts](src/lib/razorpay.ts), [src/websocket/event.ts](src/websocket/event.ts), [src/jobs/workers/generationWorker.ts](src/jobs/workers/generationWorker.ts), [prisma/schema.prisma](prisma/schema.prisma).

Every endpoint, body, response shape, status code and error string below was read out of those files. Where older docs disagree, the code wins.

---

# TABLE OF CONTENTS

| Part | Contents |
|---|---|
| **0** | Read this first — scope, cross-references, base URLs, the envelope |
| **1** | The mental model — the flow, the status machine, the one rule that matters |
| **2** | Prerequisites — login, cover type, shipping, **the address book**, the field lock |
| **3** | STEP 1 — Initiate checkout |
| **4** | STEP 2 — Open the Razorpay modal |
| **5** | STEP 3 — "Verifying your payment" ⭐ the polling screen |
| **6** | STEP 4 — The paid generation screen |
| **7** | STEP 5 — Regenerating a paid page |
| **8** | STEP 6 — The Send to Print button (stub) |
| **9** | `GET /sessions/:id` — the payment-relevant fields |
| **10** | Status reference |
| **11** | Complete endpoint index |
| **12** | ⚠️ Cautions & catches |
| **13** | Types you need to add or fix |
| **14** | Local dev setup — the webhook tunnel |
| **15** | Do not build these |
| **16** | Suggested build order |
| **A** | Appendix — the whole flow on one page |

---

# PART 0 — READ THIS FIRST

## 0.1 What this document covers

```
preview is ready  →  log in  →  cover type + shipping  →  PAY
   → Razorpay modal → "verifying your payment…" → paid pages generate
   → view all 24 pages → [Send to Print]  ← stub, toast only
```

## 0.2 What lives in other documents

Reference these; don't re-ask and don't duplicate them.

| What | Where |
|---|---|
| Everything up to `PREVIEW_READY` — session create, child details, photo, MediaPipe, generate, WebSocket basics, regenerate | [PREVIEW_GENERATION_API.md](PREVIEW_GENERATION_API.md) |
| Catalogue browsing, comic detail, pricing display on the comic page | [FRONTEND_COMIC_INTEGRATION.md](FRONTEND_COMIC_INTEGRATION.md) §5.1–5.2 |
| Country picker (`GET /api/public/countries`) | [COUNTRIES_API.md](COUNTRIES_API.md) |
| Response envelope + the full error-code table | [ANNOUNCEMENTS_API.md](ANNOUNCEMENTS_API.md) §3 |
| Direct-to-R2 upload dance | [HERO_IMAGES_API.md](HERO_IMAGES_API.md) §5.2 |
| Bubble mapper / admin panel | [bubble_feature_analysis.md](bubble_feature_analysis.md), [comic_implementation_plan.md](comic_implementation_plan.md) |

> ⚠️ **[PREVIEW_GENERATION_API.md](PREVIEW_GENERATION_API.md) §14.2 and §14.3 say "do not build checkout, payment, or paid page generation."** Those statements are **superseded by this document.** They are built, and specified below.
>
> ⚠️ **[FRONTEND_HANDOFF.md](../FRONTEND_HANDOFF.md) is stale.** It claims checkout, Razorpay, paid generation and PDF compilation have no code. All of that is false as of August 2026. Do not design from it.

## 0.3 Base URLs

| Environment | Base URL |
|---|---|
| Local dev | `http://localhost:8080` |
| Deployed (Cloud Run) | `https://unilake-backend-590672762351.asia-south1.run.app` |

> 🔴 **CORS is hardcoded to `http://localhost:3000`** ([src/app.ts:36](src/app.ts#L36)) and Better Auth carries its own `trustedOrigins` list. Both need updating at deploy time. Fine for now — we are local-only.

## 0.4 The envelope

Success: `{ "success": true, "data": <payload>, "message"?: "..." }`
Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

Your axios interceptor ([app/lib/axios.ts](../app/lib/axios.ts)) already unwraps `data` and rejects with `{ code, message }`. Every example below shows the **already-unwrapped** payload.

Codes you will hit in this flow:

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing login / cover type / shipping fields, bad session UUID, inactive country |
| 401 | `UNAUTHORIZED` | Hitting an `/api/user/*` route logged out |
| 403 | `FORBIDDEN` | The session belongs to a different user |
| 404 | `NOT_FOUND` | Session, country, or pricing rule doesn't exist |
| 409 | `CONFLICT` | Wrong session status, expired session, order already past checkout |
| 500 | `INTERNAL_SERVER_ERROR` | Razorpay unreachable, or a bug |

## 0.5 Auth tiers in this flow

| Route prefix | Guard | Used here for |
|---|---|---|
| `/api/public/*` | none | checkout, session GET, regenerate |
| `/api/user/*` | logged in | saved addresses, orders, send-to-print |
| `/api/auth/*` | Better Auth | login / logout / session |

Note the oddity: **`POST /checkout` is on `/api/public`** even though it requires a logged-in user. It doesn't read your cookie — it checks that `session.userId` was already attached via `attach-user`. See §2.2.

---

# PART 1 — THE MENTAL MODEL

## 1.1 The flow on one page

```
 ┌─ preview ready ────────────────────────────────────────────┐
 │  status: PREVIEW_READY                                     │
 └────────────────────────────────────────────────────────────┘
        │  user must be logged in, coverType + shipping set
        ▼
 ┌─ POST /sessions/:id/checkout ──────────────────────────────┐
 │  creates Razorpay order + Order row                        │
 │  status: PREVIEW_READY → AWAITING_PAYMENT                  │
 │  returns { razorpayOrderId, razorpayKeyId, amount, ... }   │
 └────────────────────────────────────────────────────────────┘
        ▼
 ┌─ Razorpay modal (their JS, their UI) ──────────────────────┐
 │  user pays                                                 │
 └────────────────────────────────────────────────────────────┘
        │                                    ╲
        │ modal fires handler()               ╲  Razorpay → your server
        ▼                                      ╲       (webhook)
 ┌─ "Verifying your payment…" ────────┐          ╲
 │  poll GET /sessions/:id every 2s   │           ▼
 │  wait for status to leave          │   status: AWAITING_PAYMENT
 │  AWAITING_PAYMENT                  │        → PAID
 └────────────────────────────────────┘        → GENERATING_PAID
        ▼                                       (jobs enqueued)
 ┌─ Paid generation screen ───────────────────────────────────┐
 │  WebSocket streams page:ready for pages 6..24              │
 │  status: GENERATING_PAID → PAID_PAGES_READY                │
 └────────────────────────────────────────────────────────────┘
        ▼
 ┌─ [ Send to Print ] ← stub. toast("Coming soon"). ──────────┐
 └────────────────────────────────────────────────────────────┘
```

## 1.2 🔴 The single most important rule

**The browser is never told that payment succeeded. It has to ask.**

When the user pays, Razorpay notifies **your server**, not the browser:

```
user pays → Razorpay servers → POST /api/webhooks/razorpay → session flips to PAID
                                  (the browser is not in this conversation)
```

Consequences you must design around:

1. **The Razorpay modal's `handler()` callback is not proof of payment.** It means Razorpay's *frontend* accepted the card. Your backend may still be a second or two behind, and in rare cases the webhook can be delayed much longer.
2. **There is no verify endpoint.** Do not build one, do not look for one. `razorpay_signature` from the handler goes nowhere — the webhook is the only thing that flips state. This is a deliberate architectural decision, not an oversight.
3. **No WebSocket event announces payment.** [src/websocket/event.ts](src/websocket/event.ts) emits exactly four messages: `page:ready`, `page:error`, `session:preview-ready`, `session:paid-ready`. None of them mean "paid."
4. **Therefore: after the modal closes, poll `GET /sessions/:id`.** That is the entire reason the "Verifying your payment" screen exists. It is not cosmetic — it is the sync mechanism.

Once the status reaches `GENERATING_PAID`, stop polling. From that point the WebSocket takes over and behaves exactly as it did during preview generation.

## 1.3 One session, one order — forever

`Order.orderSessionId` is `@unique` in the schema. A session can have **at most one** order, for its entire life. There is no cart, no line items, no second attempt that creates a second order.

This means "retry payment" never means "make a new order." It means "reopen the modal on the same order." §3.4 covers how.

## 1.4 The session status is the payment state machine

There is no separate "payment status" for you to read. `OrderSession.status` **is** the state. Read it, branch on it, and never try to infer payment state from anything else.

---

# PART 2 — PREREQUISITES BEFORE THE PAY BUTTON

## 2.1 The five things checkout requires

`initiateCheckout` ([src/services/checkout.service.ts](src/services/checkout.service.ts)) rejects in this exact order. Mirror all five client-side so the user never sees a raw 400.

| # | Requirement | Failure |
|---|---|---|
| 1 | Session not expired | 409 `"This session has expired."` |
| 2 | `status === "PREVIEW_READY"` | 409 `"Session must be in PREVIEW_READY status to checkout. Current: X"` |
| 3 | `userId` attached to the session | 400 `"You must be logged in to proceed with payment. Please log in and try again."` |
| 4 | `coverType` set | 400 `"Please select a cover type before proceeding to payment."` |
| 5 | All 7 shipping fields set | 400 `` `Missing required shipping fields: a, b, c` `` |

Plus two configuration failures that are **not** the user's fault but surface as errors:

| Requirement | Failure |
|---|---|
| A `Country` row matching `shippingCountry`, with `isActive: true` | 404 `"Country 'XX' not found..."` / 400 `"We do not currently ship to X..."` |
| A `PricingRule` for `(comicId, countryId, coverType)` | 404 `"Pricing not configured for this comic in X (HARDCOVER). Please contact support."` |

> 🟠 **Only India (`IN`) is seeded active.** Any other country will fail at the country or pricing check. Don't offer a country the `GET /api/public/countries` list doesn't return.

## 2.2 Login and `attach-user`

The session starts anonymous. Before checkout it must carry a `userId`.

**If the user was already logged in when the session was created**, `POST /sessions` attaches `userId` automatically ([src/controllers/session.controller.ts:29-37](src/controllers/session.controller.ts#L29-L37)) — nothing more to do. Check `snapshot.userId !== null`.

**Otherwise**, after the Better Auth login callback completes:

### `PATCH /api/public/sessions/:sessionId/attach-user`

- **Auth:** required (`requireLoggedIn` applied inline on this one public route)
- **Body:** none — `userId` comes from the cookie
- **Returns:** the raw `OrderSession` row

| Result | Meaning |
|---|---|
| 200 | Attached, or already attached to *this* user (idempotent — safe to call repeatedly) |
| 409 `"Session already belongs to another user"` | A different account owns this session. Dead end — send them to their dashboard. |
| 401 | Not logged in |

> 🔴 **Never send `userId` in a request body anywhere.** Every endpoint derives it server-side from the Better Auth cookie. A `userId` in a payload will be ignored at best.

**Recommended sequence:**

```
user clicks "Pay"
  └─ snapshot.userId == null?
       ├─ yes → save sessionId to storage → redirect to /login?returnTo=...
       │         └─ on return: PATCH attach-user → refetch snapshot → continue
       └─ no  → continue
```

Use [app/lib/session-storage.ts](../app/lib/session-storage.ts) to survive the OAuth round-trip.

## 2.3 Cover type

`coverType` is `"HARDCOVER" | "SOFTCOVER"`. It is a **pricing dimension** — every comic has a price for each, per country. Read them from the comic detail endpoint's `pricingRules` (see [FRONTEND_COMIC_INTEGRATION.md](FRONTEND_COMIC_INTEGRATION.md) §5.2) and persist the choice onto the session:

### `PATCH /api/public/sessions/:sessionId`

```json
{ "coverType": "HARDCOVER" }
```

[components/preview/PricingSection.tsx](../components/preview/PricingSection.tsx) already renders this selector, but currently only holds the choice in local state. It must PATCH it.

## 2.4 Shipping address

Seven required fields, plus one optional. All go on the same `PATCH /sessions/:sessionId`:

| Field | Required | Rule |
|---|---|---|
| `shippingName` | ✅ | 1–100 chars |
| `shippingLine1` | ✅ | 1–200 chars |
| `shippingLine2` | ❌ | ≤200 chars |
| `shippingCity` | ✅ | 1–100 chars |
| `shippingState` | ✅ | 1–100 chars |
| `shippingZip` | ✅ | 1–20 chars |
| `shippingCountry` | ✅ | **exactly 2 chars — ISO alpha-2**, e.g. `"IN"` |
| `shippingPhone` | ✅ | 5–20 chars |

> 🔴 `shippingCountry` is an **ISO-2 code**, not a country name. `"India"` fails the 2-char validator. The value must match a `Country.code` returned by `GET /api/public/countries`.

`notificationEmail` is separate and optional — it defaults to nothing, is independent of the account email, and is the address order/PDF mails will go to.

Logged-in users also get a reusable **address book** — see §2.5. It is a convenience layer on top of the fields above, not a replacement for them.

---

## 2.5 The address book (`SavedAddress`)

**Source:** [src/routes/user.ts](src/routes/user.ts), [src/controllers/savedAddress.controller.ts](src/controllers/savedAddress.controller.ts), [src/services/savedAddress.service.ts](src/services/savedAddress.service.ts), [src/validators/savedAddress.schema.ts](src/validators/savedAddress.schema.ts).

### 2.5.1 🔴 The single most important thing about addresses

**Saving an address does not put it on the session.** They are two separate stores with two different field-name sets.

```
SavedAddress  ──(you copy it, field by field)──►  OrderSession.shipping*  ──(backend snapshots)──►  Order.shipping*
   reusable                                          this session only                              frozen forever
```

There is **no foreign key** between them anywhere. Picking an address in your UI must trigger a `PATCH /api/public/sessions/:id` with the mapped values (§2.5.7). If you skip that step, checkout fails with `"Missing required shipping fields"` even though the user clearly selected an address.

Consequences worth internalising:

- Editing or deleting a saved address **never** changes a session or an order that already copied it.
- The `Order` gets its **own** snapshot at checkout, so even changing the session later (which the field lock forbids anyway) wouldn't alter a placed order.
- An anonymous user has no address book at all — every one of these routes is under `/api/user/*` and returns **401** when logged out. Address collection therefore has to come **after** login (§2.2), or you collect it into the session manually and offer "save this address" afterwards.

### 2.5.2 The address object

```jsonc
{
  "id": "9c1f…",
  "userId": "3ab4…",
  "label": "Home",          // optional, free text
  "name": "Asha Menon",     // recipient, NOT the account holder
  "line1": "12 Hill Road",
  "line2": "Flat 4B",       // nullable
  "city": "Thane",
  "state": "Maharashtra",
  "zip": "400601",
  "country": "IN",          // ISO alpha-2, exactly 2 chars
  "phone": "+919876543210",
  "isDefault": true,
  "createdAt": "2026-08-20T09:14:22.001Z",
  "updatedAt": "2026-08-20T09:14:22.001Z"
}
```

Field rules (identical on create; all optional on update):

| Field | Required on create | Constraint |
|---|---|---|
| `label` | ❌ | 1–50 chars. Free text — `"Home"`, `"Office"`, `"Grandma"` |
| `name` | ✅ | 1–100 chars |
| `line1` | ✅ | 1–200 chars |
| `line2` | ❌ | ≤200 chars. Nullable on **update** only (see §2.5.4) |
| `city` | ✅ | 1–100 chars |
| `state` | ✅ | 1–100 chars |
| `zip` | ✅ | 1–20 chars |
| `country` | ✅ | **exactly 2 chars — ISO alpha-2** |
| `phone` | ✅ | 5–20 chars |

> 🔴 **`isDefault` is server-controlled.** It is absent from both the create and the update schema. Sending it is silently ignored. The only way to change it is the dedicated `set-default` endpoint (§2.5.6).

> 🟠 **`country` is not validated against the `Country` table here.** The address book accepts any well-formed 2-letter code, including one we don't ship to. The rejection happens later, at checkout (§2.1). Filter your country dropdown against `GET /api/public/countries` so the user never saves an unusable address.

### 2.5.3 List addresses

```
GET /api/user/addresses
```

- **Auth:** required
- **Body:** none
- **200:** an array of address objects — **the array is directly under `data`**, not wrapped

**Ordering is fixed by the backend:** `isDefault` descending, then `createdAt` descending. So `addresses[0]` is always the default if one exists, otherwise the newest. Use that for pre-selection; don't re-sort.

Empty array for a user with no addresses — not a 404.

> There is **no `GET /api/user/addresses/:id`.** Single-address fetch does not exist. Read the list and find it client-side.

### 2.5.4 Create an address

```
POST /api/user/addresses
```

```json
{
  "label": "Home",
  "name": "Asha Menon",
  "line1": "12 Hill Road",
  "line2": "Flat 4B",
  "city": "Thane",
  "state": "Maharashtra",
  "zip": "400601",
  "country": "IN",
  "phone": "+919876543210"
}
```

- **201:** `{ success, message: "Address saved successfully", data: <address> }`
- **The very first address a user creates automatically becomes the default** (`isDefault: true`). Every subsequent one is created with `isDefault: false`. This is decided by a server-side count — you cannot influence it.
- There is **no cap** on how many addresses a user can save, and **no duplicate detection**. Two identical addresses are two rows. If you want to prevent that, do it client-side.

Errors: `400 VALIDATION_ERROR` with the specific message from the schema (`"Recipient name is required"`, `"Must be a 2-letter ISO country code"`, `"Phone number too short"`, …). `401` if logged out.

### 2.5.5 Update an address

```
PATCH /api/user/addresses/:id
```

Partial — send only what changed. **At least one field is required**, else `400 "At least one field must be provided"`.

- **200:** the updated address object (no `message`)
- `line2` accepts **`null`** here to clear it. That's the one asymmetry with create, where `line2` may be omitted but not explicitly nulled.
- `isDefault` cannot be changed here (§2.5.2).

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Empty body, or a field fails its constraint |
| 401 | `UNAUTHORIZED` | Logged out |
| 403 | `FORBIDDEN` | `"You do not have permission to access this address"` — belongs to another user |
| 404 | `NOT_FOUND` | `"Address not found"` |

### 2.5.6 Delete, and set-default

```
DELETE /api/user/addresses/:id
```

> 🟠 **Returns `200` with `data: null` and `message: "Address deleted"` — not `204`.** If your client special-cases 204 for deletes, this one won't match. (Your axios interceptor already passes through empty `data` correctly.)

**Deleting the default promotes a replacement automatically.** The backend picks the **most recently created** remaining address and flips it to default. If it was the user's only address, nothing is promoted and the user simply has none. Either way, **refetch the list after a delete** — `isDefault` may have moved to a row you weren't expecting.

```
POST /api/user/addresses/:id/set-default
```

- **Body:** none. It's an action, not a field update — which is why it's a `POST` and not a `PATCH { isDefault: true }`.
- **200:** `{ success, message: "Default address updated", data: <address> }`
- Runs in a transaction: unsets `isDefault` on every address for that user, then sets it on this one. Exactly one default is guaranteed; no race can produce two.

Both share the same 401 / 403 / 404 table as §2.5.5.

### 2.5.7 🔴 Mapping an address onto the session

This is the step people forget. The field names are **not** the same.

| `SavedAddress` | → | `OrderSession` |
|---|---|---|
| `name` | → | `shippingName` |
| `line1` | → | `shippingLine1` |
| `line2` | → | `shippingLine2` |
| `city` | → | `shippingCity` |
| `state` | → | `shippingState` |
| `zip` | → | `shippingZip` |
| `country` | → | `shippingCountry` |
| `phone` | → | `shippingPhone` |
| `label` | ✗ | **not copied** — UI-only, never reaches the session or the order |
| `isDefault` | ✗ | **not copied** |

```ts
// on "use this address"
await updateSession(sessionId, {
  shippingName:    address.name,
  shippingLine1:   address.line1,
  shippingLine2:   address.line2 ?? undefined,
  shippingCity:    address.city,
  shippingState:   address.state,
  shippingZip:     address.zip,
  shippingCountry: address.country,   // already ISO-2
  shippingPhone:   address.phone,
});
```

> 🟠 Send `undefined` for an absent `line2`, not `null`. `updateSessionSchema` types it as `.optional()` — it has no `.nullable()`, so an explicit `null` is a `400`.

### 2.5.8 Recommended UX

```
user reaches the address step
  ├─ not logged in?  → login first (§2.2), then come back
  ├─ GET /api/user/addresses
  │    ├─ empty  → show the address form → POST → then map onto session (§2.5.7)
  │    └─ has rows → radio list, pre-select addresses[0] (the default)
  │                  ├─ "Use this"      → map onto session (§2.5.7)
  │                  ├─ "Add new"       → POST → map onto session
  │                  └─ "Edit"/"Delete" → PATCH/DELETE → refetch list
  └─ verify the snapshot now has all 7 required shipping fields before enabling Pay
```

**Always re-read the session snapshot** after mapping, and gate the Pay button on the seven required `shipping*` fields actually being present there — not on "the user clicked an address." That single check prevents the most common checkout 400.

> 🟡 **Saving is optional.** A user can complete checkout with shipping fields PATCHed straight onto the session and never touch the address book. Offering a "save this address for next time" checkbox after a manual entry is a nice-to-have, not a requirement.

> 🔴 **After payment the address is frozen** (§2.6). Deleting or editing the saved address afterwards changes nothing about the order — but if your UI reads the shipping address back from the address book rather than from the session/order, it will appear to change. Read it from the session snapshot or `GET /api/user/orders/:id`, never from `SavedAddress`.

## 2.6 🔴 The post-payment field lock

The moment checkout succeeds and the session hits `AWAITING_PAYMENT`, **twelve fields freeze** ([src/services/session.service.ts:154-183](src/services/session.service.ts#L154-L183)):

`childName`, `age`, `pronounKey`, `coverType`, and all eight `shipping*` fields.

Any PATCH touching them returns **409** naming the offending fields. Only `notificationEmail` stays editable.

**Design consequence:** once the user clicks Pay, the "edit my details" and "change cover type" affordances must disappear. There is currently **no cancel-checkout endpoint**, so a user who picked the wrong cover type cannot fix it themselves. Make the pre-payment review screen clear and final.

---

# PART 3 — STEP 1: INITIATE CHECKOUT

### `POST /api/public/sessions/:sessionId/checkout`

- **Auth:** none on the route, but the session must already carry a `userId` (§2.2)
- **Body:** none. Send nothing. The address is read off the session, never from the body.

**200 response:**

```json
{
  "orderId": "b1e4...",
  "razorpayOrderId": "order_PxyzABC123",
  "razorpayKeyId": "rzp_test_xxxxxxxx",
  "amount": 99900,
  "currency": "INR",
  "displayAmount": "999.00",
  "notificationEmail": "parent@example.com"
}
```

| Field | Type | Use |
|---|---|---|
| `orderId` | string | **Our** order UUID. Use for `/api/user/orders/:id` later. Never send to Razorpay. |
| `razorpayOrderId` | string | Goes in the modal as `order_id` |
| `razorpayKeyId` | string | Goes in the modal as `key`. Publishable — safe in the browser. |
| `amount` | **integer** | **Smallest currency unit** (paise for INR). `99900` = ₹999.00. Pass to the modal as-is. |
| `currency` | string | ISO 4217, e.g. `"INR"` |
| `displayAmount` | string | **Major units, for the UI only.** `"999.00"`. Never send this to Razorpay. |
| `notificationEmail` | string \| null | Prefill hint |

> 🔴 **`amount` vs `displayAmount` is the classic mistake.** Show `displayAmount` to humans. Give `amount` to Razorpay. Never multiply anything by 100 yourself — the backend already handles zero-decimal (JPY, KRW…) and three-decimal (KWD, BHD…) currencies in [src/lib/razorpay.ts](src/lib/razorpay.ts).

**Side effect:** the session flips `PREVIEW_READY → AWAITING_PAYMENT` and an `Order` row is created at status `CREATED`.

## 3.1 Errors

| HTTP | `code` | `message` | What to show |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | `"Invalid session ID"` | Bug — bad UUID in the URL |
| 400 | `VALIDATION_ERROR` | `"You must be logged in…"` | Route to login (§2.2) |
| 400 | `VALIDATION_ERROR` | `"Please select a cover type…"` | Send back to cover selection |
| 400 | `VALIDATION_ERROR` | `"Missing required shipping fields: …"` | Send back to the address form, highlight the named fields |
| 400 | `VALIDATION_ERROR` | `"We do not currently ship to X…"` | Country picker, with a note |
| 404 | `NOT_FOUND` | `"Session not found"` | Dead session — clear storage, back to the comic |
| 404 | `NOT_FOUND` | `"Country 'XX' not found…"` | Config gap. Generic "contact support." |
| 404 | `NOT_FOUND` | `"Pricing not configured for this comic in X (HARDCOVER)…"` | Config gap. Generic "contact support." |
| 409 | `CONFLICT` | `"This session has expired."` | Terminal. Offer to start over. |
| 409 | `CONFLICT` | `"Session must be in PREVIEW_READY status to checkout. Current: X"` | See §3.3 |
| 409 | `CONFLICT` | `"An order already exists for this session with status X…"` | Already paid — go to §6, not the modal |
| 409 | `CONFLICT` | `"This order is in an inconsistent state…"` | Rare. Contact support. |
| 500 | `INTERNAL_SERVER_ERROR` | `"Payment gateway is temporarily unavailable. Please try again."` | Retryable — show a Try Again button |
| 500 | `INTERNAL_SERVER_ERROR` | `"Failed to save order. Please try again."` | Retryable |

## 3.2 🔴 Make the Pay button un-double-clickable

Disable it on the first click and keep it disabled until either the modal is open or the request has failed. Two in-flight checkouts are not dangerous (the unique constraint prevents duplicate orders), but they produce confusing 409s.

## 3.3 Resuming an abandoned checkout

**This endpoint is idempotent while the order is unpaid.**

If the user opened the modal, closed it without paying, and clicks Pay again, call the exact same endpoint. It detects the existing `CREATED` order and returns **the same `razorpayOrderId`, the same amount, 200 OK**. Reopen the modal with that payload.

You do not need to detect this case or branch on it. Just call `/checkout` again.

> **Historical note:** before August 22, 2026 this returned a 409 and stranded the user permanently. If you are testing against an older backend build and see `"Session must be in PREVIEW_READY status to checkout. Current: AWAITING_PAYMENT"` on a retry, the backend is out of date — pull.

**When it will *not* resume:** if the order has moved past `CREATED` (i.e. the payment actually landed), you get the 409 `"An order already exists…"`. That is the "already paid" signal — skip the modal, go straight to §5's polling or §6's generation screen.

## 3.4 Where to call it from

Resume also matters on a **cold page load**. If the user reloads and the snapshot says `AWAITING_PAYMENT`, don't show them a broken preview screen — show a "Complete your payment" resume card that calls `/checkout` and reopens the modal.

---

# PART 4 — STEP 2: OPEN THE RAZORPAY MODAL

## 4.1 Load the script

Razorpay's Checkout is an external script. It is **not** an npm package.

```html
https://checkout.razorpay.com/v1/checkout.js
```

Load it lazily — only when the user reaches the payment step, not in the root layout. In Next.js use `next/script` with `strategy="lazyOnload"`, or inject it manually and await `onload`. Guard against double-injection.

Do not proceed to `new window.Razorpay(...)` until the script has actually loaded, or you'll get `Razorpay is not defined`.

## 4.2 The options object

```js
const options = {
  key: data.razorpayKeyId,
  amount: data.amount,             // integer, smallest unit — as returned
  currency: data.currency,
  order_id: data.razorpayOrderId,  // MUST be set; this ties the payment to our order

  name: "Unilake",
  description: `${comicTitle} — ${coverType === "HARDCOVER" ? "Hardcover" : "Softcover"}`,
  image: "/logo.png",

  prefill: {
    name: snapshot.shippingName ?? "",
    email: data.notificationEmail ?? "",
    contact: snapshot.shippingPhone ?? "",
  },

  notes: { sessionId },
  theme: { color: "#914A8C" },

  handler: (response) => { /* §4.3 */ },
  modal: {
    ondismiss: () => { /* §4.4 */ },
    escape: true,
    confirm_close: true,
  },
};

const rzp = new window.Razorpay(options);
rzp.on("payment.failed", (resp) => { /* §4.5 */ });
rzp.open();
```

> 🔴 **`order_id` is mandatory.** Omitting it puts Razorpay in a different mode where the payment is not linked to our order, the webhook can't be matched to a local `Order`, and the payment becomes an orphan requiring manual admin reconciliation.

## 4.3 The `handler` callback

Fires when Razorpay's frontend reports success. You receive:

```js
{
  razorpay_payment_id: "pay_XXXX",
  razorpay_order_id:   "order_XXXX",
  razorpay_signature:  "hex..."
}
```

> 🔴 **Do not POST this anywhere.** There is no verify endpoint. Sending it to the backend will 404.

Its **only** job is to be your cue to switch the UI to the "Verifying your payment" screen (§5) and start polling. Log the `razorpay_payment_id` client-side — it's useful for support tickets.

## 4.4 The `modal.ondismiss` callback

Fires when the user closes the modal without completing payment.

Do **not** treat this as failure and do **not** immediately show an error. There is a race: a user can complete payment and dismiss the modal fast enough that `ondismiss` fires alongside or instead of `handler`.

**Safe behaviour:** on dismiss, do a single `GET /sessions/:id`.

- Status still `AWAITING_PAYMENT` → genuinely abandoned. Show the resume card (§3.3): *"Payment not completed — Try again."*
- Status is anything past it → they actually paid. Go to §5/§6.

## 4.5 `payment.failed`

```js
rzp.on("payment.failed", (resp) => {
  // resp.error.{code, description, reason, source, step, metadata.payment_id}
});
```

The backend logs `payment.failed` webhooks for support but **changes no state** — the session stays at `AWAITING_PAYMENT` and the order stays `CREATED`. So a failed payment is fully retryable: show the error description and a Try Again button that re-runs §3 (which resumes the same order).

---

# PART 5 — STEP 3: "VERIFYING YOUR PAYMENT" ⭐

This is the screen the whole flow hinges on. Get it right.

## 5.1 Why it exists

Re-read §1.2. The browser has no idea whether the webhook has landed. This screen is the bridge.

## 5.2 The poll

**Endpoint:** `GET /api/public/sessions/:sessionId` — no auth, returns the full snapshot (§9).

| Setting | Value | Why |
|---|---|---|
| Interval | **2 seconds** | 10s feels broken right after paying |
| Timeout | **90 seconds** | Generous; the webhook is usually < 5s |
| Poll regardless of WebSocket | **yes** | The socket carries no payment message — see §12.2 |

## 5.3 Branch on `status`

| `status` | Meaning | Do |
|---|---|---|
| `AWAITING_PAYMENT` | Webhook hasn't landed | Keep polling, keep the spinner |
| `PAID` | Webhook landed; jobs being enqueued | Keep polling — this state lasts milliseconds |
| `GENERATING_PAID` | ✅ Jobs queued | **Stop. Redirect to §6.** |
| `PAID_PAGES_READY` | ✅ Already finished (very fast comic, or a reload much later) | **Stop. Redirect to §6.** |
| `CONFIRMED` and beyond | Already sent to print | Stop. Route to the order view. |
| `FAILED` | Every paid page failed to generate | Stop. Show a support message — **do not** say the payment failed; the money was taken. |

Treat anything in `["GENERATING_PAID", "PAID_PAGES_READY", "CONFIRMED", "COMPILING_PDF", "SHIPMENT_QUEUED", "COMPLETED"]` as "payment confirmed, move on."

## 5.4 On timeout

After 90 seconds still at `AWAITING_PAYMENT`, **do not say the payment failed.** It very likely succeeded and the webhook is delayed.

Show something like:

> **We're still confirming your payment.**
> Your payment may have gone through — we're waiting on confirmation from our payment provider. You'll get an email as soon as your comic starts generating. You can safely close this page.

Offer a *Check again* button (restarts the poll) and a support contact. Never offer *Pay again* from this state — a second payment attempt on a captured order will be rejected by Razorpay, but the UX is alarming.

## 5.5 Copy for the screen

Keep it calm and specific. Suggested:

- Title: **Verifying your payment**
- Body: *Please don't close this window. This usually takes a few seconds.*
- After ~20s, soften: *Still working — payment confirmations occasionally take a little longer.*

## 5.6 Reload safety

Put the sessionId in the URL and drive this screen off the snapshot's `status`, not off in-memory state. If the user reloads mid-verification, the page must resume polling automatically. `AWAITING_PAYMENT` on a cold load ⇒ show either the resume card (§3.3) or the verifying screen; pick based on whether you have a stored "modal was completed" flag.

---

# PART 6 — STEP 4: THE PAID GENERATION SCREEN

## 6.1 What's happening on the backend

When the webhook lands, `enqueuePaidGenerationJobs` queues **one job per non-preview page** ([src/services/session.service.ts:774](src/services/session.service.ts#L774)). Pages generate in parallel (worker concurrency 5) and stream back exactly as preview pages did.

Timing: face pages take **~120s each**, non-face pages **1–3s**. A 24-page comic with ~14 paid face pages lands in roughly **6–8 minutes**. Design for a long wait — this is not a spinner, it's a progress experience.

## 6.2 Reuse the WebSocket

The socket from the preview phase, if still open, **keeps working** — same room, same token, same events. Nothing to reconnect.

If you're mounting a fresh screen, connect as documented in [PREVIEW_GENERATION_API.md](PREVIEW_GENERATION_API.md) §6:

```
ws://localhost:8080/?sessionId=<id>&token=<wsRoomToken>
```

> ✅ Paid sessions are **exempt from the 24-hour expiry**, so the handshake will not 410 on you mid-generation.

## 6.3 The events

Identical shapes to preview. See [PREVIEW_GENERATION_API.md](PREVIEW_GENERATION_API.md) §8.1.

| Event | Payload | Note |
|---|---|---|
| `page:ready` | `{ type, pageNumber, variantIndex, imageUrl, displayImageUrl, pageVersionId }` | `imageUrl` = print master. Render `displayImageUrl ?? imageUrl`. |
| `page:error` | `{ type, pageNumber, variantIndex, errorMessage }` | **Not final** — BullMQ retries. Don't render as permanent failure. |
| `session:paid-ready` | `{ type: "session:paid-ready" }` | 🆕 **New event.** All paid pages settled, at least one succeeded. |

> 🔴 **`session:paid-ready` is missing from [app/types/session.ts](../app/types/session.ts).** The `WSEvent` union has only the three preview events, so this message will fall through your handler silently. See §13.

There is **no** session-level event when paid generation fails wholesale. You learn that from the snapshot's `status` becoming `FAILED`. Keep a slow poll (or refetch on `page:error`) as a backstop.

## 6.4 Rendering the book

The snapshot returns **all** pages, preview and paid, in `pageNumber` order. After payment there is no paywall — render the whole book.

```ts
const allPages   = snapshot.pages;                                  // full book
const paidPages  = snapshot.pages.filter(p => !p.isPreviewPage);    // what's generating now
```

Per page, show the **latest** variant:

```ts
const latest  = page.variants.at(-1);              // variants are ascending by variantIndex
const imgSrc  = latest?.displayImageUrl ?? latest?.finalImageUrl;
```

Per-page states:

| Variant `status` | Render |
|---|---|
| no variant yet | Skeleton / placeholder |
| `QUEUED`, `TEXT_STAMPING`, `TEXT_STAMPED`, `GENERATING_SD` | `GeneratingPlaceholder` with a progress hint |
| `SD_READY` | The image |
| `FAILED` | Retry affordance (§7) — but see the "not final" caveat above |

[components/preview/PreviewPageCard.tsx](../components/preview/PreviewPageCard.tsx) and [GeneratingPlaceholder.tsx](../components/preview/GeneratingPlaceholder.tsx) already handle all of this. Reuse them; drop the `LockedPageOverlay`.

## 6.5 Progress

```ts
const total = snapshot.pages.filter(p => !p.isPreviewPage).length;
const done  = snapshot.pages
  .filter(p => !p.isPreviewPage)
  .filter(p => p.variants.some(v => v.status === "SD_READY")).length;
```

> 🟠 Derive the denominator from the snapshot, **never** from `comic.freePreviewPages` or `comic.pageCount`. Those are admin-typed and can disagree with the actual page flags. Same rule as [PREVIEW_GENERATION_API.md](PREVIEW_GENERATION_API.md) §13.7.

## 6.6 Completion

Session flips `GENERATING_PAID → PAID_PAGES_READY` and `session:paid-ready` fires. Reveal the **Send to Print** button (§8).

If some pages failed but others succeeded, the session **still** flips to `PAID_PAGES_READY` ("success-wins"). Show the successful pages and a retry on the failed ones. Only if *every* paid page failed does it become `FAILED`.

## 6.7 Leaving and coming back

The user can close the tab. Generation continues server-side. On return, `GET /sessions/:id` rehydrates everything — including pages that finished while they were away. Always GET first, then attach the socket.

---

# PART 7 — STEP 5: REGENERATING A PAID PAGE

Identical endpoint and shape to preview regeneration ([PREVIEW_GENERATION_API.md](PREVIEW_GENERATION_API.md) §9):

### `POST /api/public/sessions/:sessionId/pages/:pageNumber/regenerate`

```json
{ "queued": true, "pageNumber": 12, "variantIndex": 1, "hasPaid": true }
```

**What changes after payment:**

| | Before payment | After payment |
|---|---|---|
| Variant cap per page | **3** | **8** |
| Allowed statuses | `GENERATING_PREVIEW`, `PREVIEW_READY`, `FAILED` | + `GENERATING_PAID`, `PAID_PAGES_READY` |

- The cap **counts the original**, so 8 means the first generation plus 7 regenerations.
- Preview-page variants made before payment **persist and count** toward the post-payment cap of 8.
- `hasPaid: true` in the response confirms the higher cap is in force.
- Hitting the cap → 409 `"Maximum regenerations (8) already reached for page N"`. Disable the button at `variants.length >= 8`.
- Regeneration is **blocked from `CONFIRMED` onward** — once Send to Print is real, the book is locked.

The new variant arrives over the WebSocket as a `page:ready` with a **new `pageVersionId`**. Match on `pageVersionId`, never on `variantIndex` alone — [useSessionPreview.ts](../hooks/useSessionPreview.ts) already does this correctly.

---

# PART 8 — STEP 6: THE SEND TO PRINT BUTTON

## 8.1 What to build now

A button at the end of the page list, enabled only when `status === "PAID_PAGES_READY"`:

```tsx
<Button onClick={() => toast.info("Coming soon!")}>
  Send to Print
</Button>
```

That's it. **Do not wire it to the backend.**

## 8.2 🔴 Why you must not call the real endpoint yet

`POST /api/user/sessions/:sessionId/send-to-print` **exists and works.** It is not a stub. Calling it will:

1. Permanently mark the customer's chosen variant for every page (`isSelected`)
2. Flip the session `PAID_PAGES_READY → CONFIRMED` and the order `GENERATED → CONFIRMED`
3. **Lock the session** — regeneration is refused from `CONFIRMED` onward
4. Enqueue real PDF compilation, which uploads a print-ready PDF to R2
5. Hand off to the (currently stubbed) Shiprocket worker

**There is no undo and no admin endpoint to reverse it.** An accidental call during development burns that session permanently.

## 8.3 For reference — the contract, when it's time

```
POST /api/user/sessions/:sessionId/send-to-print     ← note: /api/user, NOT /api/public
```

Requires auth (the user must own the session).

```json
{
  "selections": [
    { "pageNumber": 1,  "variantIndex": 0 },
    { "pageNumber": 2,  "variantIndex": 2 },
    { "pageNumber": 24, "variantIndex": 0 }
  ]
}
```

Rules, from [src/validators/sendToPrint.schema.ts](src/validators/sendToPrint.schema.ts) and the service:

- **One entry per page — every page, preview and paid.** Count must equal `Comic.pageCount`.
- No duplicate `pageNumber` values.
- Every referenced variant must exist and be `SD_READY`.
- **No variant anywhere in the session may be in flight** — if anything is still generating, the whole call is rejected.
- Idempotent: calling again at `CONFIRMED` re-enqueues the PDF job and returns success without changing state.

Response: `{ sessionId, orderId, status: "CONFIRMED", pdfCompilationEnqueued: true }`

> 🔴 **Selection is a single batch commit.** There is deliberately no per-page "use this one" endpoint. The user browses variants with zero API calls; everything commits at once, here. Do not build a per-page select.

## 8.4 What comes after (not your problem yet)

PDF compilation → Shiprocket → shipping. Session moves `CONFIRMED → COMPILING_PDF → SHIPMENT_QUEUED → COMPLETED`. Customer-facing order state is at `GET /api/user/orders` / `/:id`, which returns a derived `publicStatus` string (`"Printing"`, `"Shipped"`, …) rather than the raw enum.

---

# PART 9 — `GET /sessions/:id` — PAYMENT-RELEVANT FIELDS

Full shape is documented in [PREVIEW_GENERATION_API.md](PREVIEW_GENERATION_API.md) §10. What matters here:

```jsonc
{
  "id": "…",
  "userId": "…" | null,          // null ⇒ must attach-user before checkout (§2.2)
  "coverType": "HARDCOVER" | null,
  "status": "AWAITING_PAYMENT",  // ← the payment state machine
  "notificationEmail": "…" | null,

  "shippingName": "…", "shippingLine1": "…", "shippingLine2": null,
  "shippingCity": "…", "shippingState": "…", "shippingZip": "…",
  "shippingCountry": "IN", "shippingPhone": "…",

  "wsRoomToken": "…",
  "expiresAt": "…",
  "isExpired": false,            // always false once AWAITING_PAYMENT or later

  "comic": { "id": "…", "title": "…", "freePreviewPages": 5, "coverThumbnailUrls": ["…"] },

  "pages": [
    {
      "pageId": "…", "pageNumber": 1,
      "isPreviewPage": true, "hasFace": true,
      "variants": [
        {
          "pageVersionId": "…", "variantIndex": 0,
          "status": "SD_READY",
          "finalImageUrl": "https://…png",     // print master — do not render
          "displayImageUrl": "https://…webp",  // render this
          "isSelected": false,
          "errorMessage": null
        }
      ]
    }
  ]
}
```

Notes:

- **There is no `order` object on this response.** It carries no amount, no `razorpayOrderId`, no payment id. If you need order details, use `GET /api/user/orders/:id`.
- `isExpired` is computed and is **always `false`** from `AWAITING_PAYMENT` onward — paid sessions never expire.
- `bestPhotoUrl` is a private R2 key and is **not renderable**. Never put it in an `<img>`.
- All pages are returned, always — preview and paid — regardless of status.

---

# PART 10 — STATUS REFERENCE

## 10.1 Session statuses in this flow

| Status | Meaning | Screen |
|---|---|---|
| `PREVIEW_READY` | Free preview done | Preview + pricing + Pay button |
| `AWAITING_PAYMENT` | Checkout initiated; payment not confirmed | Verifying (§5) or Resume card (§3.3) |
| `PAID` | Webhook landed; jobs being queued | Verifying — transient, milliseconds |
| `GENERATING_PAID` | Paid pages generating | Paid generation screen (§6) |
| `PAID_PAGES_READY` | ✅ All paid pages settled | Full book + Send to Print (§8) |
| `CONFIRMED` | Sent to print | Order view — out of scope |
| `COMPILING_PDF` / `PDF_FAILED` | PDF stage | Out of scope |
| `SHIPMENT_QUEUED` / `SHIPMENT_FAILED` | Shipping stage | Out of scope |
| `COMPLETED` | Handed to courier | Out of scope |
| `FAILED` | ⚠️ **overloaded** — see §12.5 | Depends |

Full list, straight from the enum: `CREATED`, `PHOTO_UPLOADED`, `GENERATING_PREVIEW`, `PREVIEW_READY`, `AWAITING_PAYMENT`, `PAID`, `GENERATING_PAID`, `PAID_PAGES_READY`, `CONFIRMED`, `COMPILING_PDF`, `PDF_FAILED`, `SHIPMENT_QUEUED`, `SHIPMENT_FAILED`, `COMPLETED`, `FAILED`.

> 🔴 `DISPATCHED` was **removed** from the backend enum. It is still present in [app/types/session.ts](../app/types/session.ts). See §13.

## 10.2 Page variant statuses

`QUEUED` → `TEXT_STAMPING` → `TEXT_STAMPED` → `GENERATING_SD` → `SD_READY`, or `FAILED` from any stage. Non-face pages skip `GENERATING_SD`.

## 10.3 Order statuses (informational)

You never read these directly in this flow, but for context: `CREATED → PAID → GENERATED → CONFIRMED → READY_TO_SHIP → SHIPPED → DELIVERED`, plus `SHIPROCKET_FAILED` and `CANCELLED`. The customer-facing endpoints expose a derived `publicStatus` string instead of the raw value.

---

# PART 11 — COMPLETE ENDPOINT INDEX

| Method | Path | Auth | Purpose | § |
|---|---|---|---|---|
| `PATCH` | `/api/public/sessions/:id` | none | Set `coverType`, shipping, `notificationEmail` | 2.3, 2.4 |
| `PATCH` | `/api/public/sessions/:id/attach-user` | ✅ | Attach the logged-in user | 2.2 |
| `GET` | `/api/public/countries` | none | Active countries for the picker | 2.4 |
| `POST` | `/api/public/sessions/:id/checkout` | none* | Create/resume the Razorpay order | 3 |
| `GET` | `/api/public/sessions/:id` | none | The snapshot — polling + rehydration | 5, 9 |
| `POST` | `/api/public/sessions/:id/pages/:n/regenerate` | none | Regenerate one page | 7 |
| `GET` | `/api/user/addresses` | ✅ | List addresses (default first) | 2.5.3 |
| `POST` | `/api/user/addresses` | ✅ | Create — first one auto-defaults | 2.5.4 |
| `PATCH` | `/api/user/addresses/:id` | ✅ | Update (partial, ownership checked) | 2.5.5 |
| `DELETE` | `/api/user/addresses/:id` | ✅ | Delete — auto-promotes a new default | 2.5.6 |
| `POST` | `/api/user/addresses/:id/set-default` | ✅ | Set default (no body) | 2.5.6 |
| `GET` | `/api/user/orders` · `/api/user/orders/:id` | ✅ | Customer order list/detail | 8.4 |
| `POST` | `/api/user/sessions/:id/send-to-print` | ✅ | ⛔ **Do not call yet** | 8.2 |
| — | `ws://…/?sessionId=&token=` | token | Live page events | 6.2 |
| — | `POST /api/webhooks/razorpay` | signature | ⛔ Razorpay → backend only. Never call. | 1.2 |

\* No route guard, but the session must already carry a `userId`.

---

# PART 12 — ⚠️ CAUTIONS & CATCHES

## 12.1 🔴 The modal's `handler` is not proof of payment
Covered in §1.2 and §4.3. The single most common way to get this flow wrong. Always poll.

## 12.2 🔴 Don't skip polling because the WebSocket is connected
Your current `refetchInterval` starts with `if (wsConnected) return false;`. That's right for generation — but **no payment message ever travels over the socket**, so during `AWAITING_PAYMENT` a connected socket tells you nothing. Poll regardless of socket state in that status. See §13 item 7.

## 12.3 🔴 `amount` is in paise, `displayAmount` is in rupees
Never show `amount` to a user (₹99,900 instead of ₹999). Never send `displayAmount` to Razorpay. Never multiply by 100 yourself.

## 12.4 🔴 Never call `send-to-print` during development
It is real, it is irreversible, and it burns the session. §8.2.

## 12.5 🟠 `FAILED` means three different things
Generation failed, *or* the session expired on a mutation, *or* the hourly sweeper expired it. Before offering any retry on a `FAILED` session, check `isExpired` — an expired session's retry will always 409. Paid sessions are exempt from expiry, so in this flow `FAILED` almost always means "generation failed."

## 12.6 🟠 A malformed session UUID
`/checkout` validates the UUID and returns a clean 400. But `GET /sessions/:id` does **not** — a malformed ID reaches the DB and surfaces as a 500. Validate client-side before polling.

## 12.7 🟠 `page:error` is not final
BullMQ retries. A page can emit `page:error` and then `page:ready` moments later. Never render it as a permanent failure; treat the snapshot as truth.

## 12.8 🟠 Multiple tabs are not coordinated
Two tabs on the same session both receive all WebSocket events and can both fire regenerate. The variant cap is enforced transactionally so nothing corrupts, but the UI can look odd. Not worth solving now.

## 12.9 🟠 No rate limiting exists
Nothing throttles `/checkout` or `/regenerate`. Be disciplined on the client — debounce, disable buttons, don't retry in tight loops.

## 12.10 🟡 The `notes` you pass to Razorpay are cosmetic
The backend already stamps `sessionId`, `comicId`, `userId` and `coverType` into the order's notes at creation. Anything you add client-side is for your own debugging only.

## 12.11 🔴 Saving an address does not put it on the session
Two separate stores, two different field-name sets, no foreign key between them. Selecting an address must be followed by a `PATCH /sessions/:id` with the values mapped (§2.5.7), or checkout returns `"Missing required shipping fields"` on an address the user clearly picked.

## 12.12 🟠 `isDefault` cannot be set through create or update
It is absent from both schemas and silently ignored if sent. First address auto-defaults; after that only `POST /addresses/:id/set-default` changes it (§2.5.6).

## 12.13 🟠 Deleting the default silently moves it
The backend promotes the most recently created remaining address. Always refetch the list after a delete rather than mutating it in place.

## 12.14 🟡 There is no cancel-checkout
Once at `AWAITING_PAYMENT` the user cannot change cover type or address (§2.6) and cannot abandon cleanly. Make the pre-payment review screen unambiguous.

---

# PART 13 — TYPES YOU NEED TO ADD OR FIX

All in [app/types/session.ts](../app/types/session.ts).

**1. `SessionStatus` is stale.** Remove `DISPATCHED` (deleted from the backend enum). Add the four missing values:

```ts
| "PDF_FAILED"
| "SHIPMENT_QUEUED"
| "SHIPMENT_FAILED"
```

**2. `WSEvent` is missing `session:paid-ready`.** Add:

```ts
export interface PaidReadyEvent { type: "session:paid-ready"; }

export type WSEvent =
  | PageReadyEvent | PageErrorEvent | PreviewReadyEvent | PaidReadyEvent;
```

Without this the event silently falls through your handler and the Send to Print button never appears.

**3. Add the checkout response type:**

```ts
export interface CheckoutResponse {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;          // smallest unit (paise)
  currency: string;
  displayAmount: string;   // major units, for display
  notificationEmail: string | null;
}
```

**4. `updateSession` in [app/actions/session/index.ts](../app/actions/session/index.ts) is too narrow.** Its payload type accepts only `childName`, `age`, `pronounKey`, `notificationEmail`. Widen it to include `coverType` and all eight `shipping*` fields — the backend already accepts them.

**5. Add the address types** — there is currently no `app/types/address.ts` and no `app/actions/address/` module. Both need creating:

```ts
export interface SavedAddress {
  id: string;
  userId: string;
  label: string | null;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;      // ISO alpha-2
  phone: string;
  isDefault: boolean;   // read-only — server-controlled (§2.5.2)
  createdAt: string;
  updatedAt: string;
}

// isDefault is deliberately absent — it cannot be set on create or update.
export type CreateAddressInput = Omit<
  SavedAddress, "id" | "userId" | "isDefault" | "createdAt" | "updatedAt"
>;

export type UpdateAddressInput = Partial<CreateAddressInput>;
```

Note these calls need `withCredentials` (they're on `/api/user/*`) — your axios instance already sets it globally.

**6. Declare the Razorpay global** so TypeScript accepts `window.Razorpay`:

```ts
declare global {
  interface Window { Razorpay: new (options: RazorpayOptions) => { open(): void; on(e: string, cb: (r: unknown) => void): void }; }
}
```

**7. `useSessionPreview.refetchInterval` needs the payment branch** ([hooks/useSessionPreview.ts:64-70](../hooks/useSessionPreview.ts#L64-L70)):

- Add `AWAITING_PAYMENT` and `PAID` to the polling statuses
- Poll them at **2000ms**, not 10000ms
- Poll them **even when `wsConnected` is true** (§12.2)
- Add `GENERATING_PAID` to the 10s socket-down fallback alongside `GENERATING_PREVIEW`

---

# PART 14 — LOCAL DEV SETUP: THE WEBHOOK TUNNEL

**Nothing in this flow works locally until Razorpay can reach your machine.** The webhook is the *only* thing that flips a session to `PAID`. Without it, you pay successfully and the session sits at `AWAITING_PAYMENT` forever, and §5 will always time out.

1. Start the backend on `:8080`.
2. Tunnel it: `ngrok http 8080` → note the `https://xxxx.ngrok-free.app` URL.
3. In the **Razorpay Dashboard → Settings → Webhooks**, add:
   - **URL:** `https://xxxx.ngrok-free.app/api/webhooks/razorpay`
   - **Secret:** the exact value of `RAZORPAY_WEBHOOK_SECRET` in the backend `.env`
   - **Active events:** `payment.captured` (required), `payment.failed` (recommended)
4. Use Razorpay **test mode** keys and [test cards](https://razorpay.com/docs/payments/payments/test-card-details/).

The tunnel URL changes every time ngrok restarts — you must update the dashboard each time.

**How to tell it's working:** after a test payment, the backend log should show
`"Payment captured — Order + Session flipped to PAID"` followed by `"Paid-page generation enqueued after payment"`.
If you don't see those, the webhook isn't arriving and no amount of frontend work will help.

---

# PART 15 — DO NOT BUILD THESE

| ⛔ | Why |
|---|---|
| A payment-verify endpoint / POSTing `razorpay_signature` | Doesn't exist by design. The webhook is the sole trigger. |
| Anything that calls `POST /api/webhooks/razorpay` | Razorpay's, not yours. Signature-protected. |
| A real Send to Print submission | §8.2 — irreversible. Toast only. |
| A per-page "use this variant" call | Selection is one batch commit at send-to-print. No such endpoint. |
| A cart, quantities, or multiple comics per order | One session = one comic = one order. Structurally enforced. |
| Sending `userId` in any body | Always derived from the cookie server-side. |
| A cancel-payment / refund flow | No-refund policy; `REFUNDED` was dropped from the enum. |
| PDF download UI | Not in this milestone. |
| Order tracking / shipping UI | Waits on real Shiprocket. |
| Multiplying amounts by 100 | The backend is currency-aware. §12.3. |

---

# PART 16 — SUGGESTED BUILD ORDER

1. **Set up the webhook tunnel (§14).** Do this first — nothing is testable without it. Confirm with a manual test payment that the backend logs the capture.
2. **Fix the types (§13).** Small, unblocks everything, prevents silent event drops.
3. **Prerequisites UI (§2).** Login gate + `attach-user`, cover-type PATCH, then the address step: address-book list/create/edit/delete/set-default (§2.5) **plus the mapping onto the session** (§2.5.7) — the mapping is the half that's easy to forget and the half checkout actually reads. Verify by checking the snapshot has `userId`, `coverType` and all seven `shipping*` fields.
4. **Checkout call + error mapping (§3).** Don't open the modal yet — just log the response and confirm the session flips to `AWAITING_PAYMENT` and that calling it twice returns the same `razorpayOrderId`.
5. **The Razorpay modal (§4).** Get `handler` and `ondismiss` firing. Log only.
6. **The verifying screen (§5).** The heart of it. Test: happy path, reload mid-poll, dismiss-without-paying, and the 90-second timeout copy.
7. **The paid generation screen (§6).** Mostly reuse of the preview components with the paywall removed.
8. **Regenerate post-payment (§7).** Confirm the cap is 8, not 3.
9. **The stub Send to Print button (§8.1).** Ten minutes.
10. **Resume-on-cold-load (§3.4).** The polish pass that stops reloads looking broken.

---

# APPENDIX — THE WHOLE FLOW ON ONE PAGE

```
PREVIEW_READY
   │
   ├─ snapshot.userId == null? ──► /login ──► PATCH attach-user
   ├─ PATCH { coverType }
   │
   ├─ ADDRESS STEP
   │    GET /api/user/addresses            (401 if logged out — login first)
   │      ├─ empty    → form → POST /api/user/addresses  (first one auto-defaults)
   │      └─ has rows → pick one (addresses[0] is the default)
   │    ▼
   │    PATCH /api/public/sessions/:id  { shipping* }   ← MAP the fields, §2.5.7
   │      name→shippingName  line1→shippingLine1  line2→shippingLine2
   │      city→shippingCity  state→shippingState  zip→shippingZip
   │      country→shippingCountry (ISO-2)  phone→shippingPhone
   │      (label and isDefault are NOT copied)
   │    ▼
   │    re-read snapshot — all 7 required shipping* present? → enable Pay
   │
   ▼  [Pay] (disable on click)
POST /api/public/sessions/:id/checkout        (no body)
   │  → { orderId, razorpayOrderId, razorpayKeyId, amount, currency,
   │      displayAmount, notificationEmail }
   │  → session: PREVIEW_READY → AWAITING_PAYMENT
   ▼
new window.Razorpay({ key, amount, currency, order_id, prefill, handler, modal }).open()
   │
   ├─ handler()    → show "Verifying your payment…"   (do NOT post the signature)
   └─ ondismiss()  → GET snapshot once
                      ├─ still AWAITING_PAYMENT → "Payment not completed. Try again."
                      └─ moved on              → treat as paid
   ▼
POLL GET /api/public/sessions/:id   every 2s, max 90s, ignore wsConnected
   │
   ├─ AWAITING_PAYMENT / PAID          → keep polling
   ├─ GENERATING_PAID / PAID_PAGES_READY → ✅ stop, redirect
   ├─ FAILED                            → support message (money WAS taken)
   └─ 90s timeout                       → "still confirming" + Check again
   ▼
PAID GENERATION SCREEN
   │  WebSocket: page:ready / page:error / session:paid-ready
   │  render displayImageUrl ?? finalImageUrl
   │  progress = paid pages with an SD_READY variant / total paid pages
   │  regenerate allowed, cap 8
   ▼
PAID_PAGES_READY
   ▼
[ Send to Print ] → toast.info("Coming soon!")     ⛔ never call the real endpoint
```
