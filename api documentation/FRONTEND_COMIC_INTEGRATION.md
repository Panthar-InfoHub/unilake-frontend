# Unilake — Comic Integration Guide (Frontend)

**Scope:** Everything needed to build (a) the **admin comic upload wizard** and (b) the **user-facing comic browse/detail pages**.
**Out of scope for now:** photo upload, generation, checkout, payment. Those endpoints exist but you are not wiring them yet.

**Audience:** Frontend team.
**Last verified against code:** July 28, 2026. Every endpoint, request body, and response shape below was read directly out of the route/controller/service/validator files — not from older docs.

---

# PART 0 — READ THIS FIRST

## 0.1 The mental model: what "uploading a comic" actually means

A comic is **not** one form submit. It is a tree of four record types, created in a strict order because each level needs the ID of the level above it:

```
Country  (global, created once, reused by every comic)
Theme    (global, created once, reused by every comic)
   │
   └── Comic ────────────────────────────────── you create this in ONE call,
        │                                        and pricing rules are created with it
        │
        ├── Font        (per comic — the typefaces used in this comic's speech bubbles)
        │
        └── Page        (one per physical page of the book, e.g. 24 of them)
             │
             └── Bubble (one per speech bubble on that page — a rectangle + the dialogue text)
```

So the wizard is really: **create the comic shell → attach fonts → attach pages → attach bubbles to pages → publish.**

## 0.2 The file-upload pattern (used everywhere — learn it once)

**No file is ever POSTed to our backend.** Files go straight from the browser to Cloudflare R2. Our backend only hands out a temporary signed URL and later records where the file went.

Every single upload in this system follows this exact 3-step dance:

```
STEP 1  →  POST <our backend>/.../upload-url
           You send: filename + type
           You get back: { uploadUrl, key }

STEP 2  →  PUT <uploadUrl>          ← direct to Cloudflare, NOT our backend
           Body: the raw File object
           Header: Content-Type must EXACTLY match what you declared in step 1
           No auth header. Do NOT send cookies. Do NOT use your axios instance
           (its default headers/credentials will break the signature).

STEP 3  →  POST/PATCH <our backend>/...
           You send the `key` string from step 1 in the record you're creating.
           The backend stores it.
```

**The `key` is the contract.** It is an opaque string like `comics/temp/9f2c...-cover.png`. You never build it yourself, never modify it, never guess it. You get it in step 1 and pass it back in step 3.

Reference implementation you should write once and reuse:

```ts
async function uploadToR2(uploadUrl: string, file: File, contentType: string) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
    // deliberately NO credentials, NO Authorization header
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
}
```

⚠️ **The #1 cause of failed uploads is a Content-Type mismatch.** If you asked for `image/png` in step 1, you must send `Content-Type: image/png` in step 2. `image/jpg` ≠ `image/jpeg`. The signature covers the content type, so a mismatch returns a 403 from Cloudflare with an unhelpful XML body.

⚠️ **Signed URLs expire.** Thumbnails: 15 min. Page artwork/masks: 15 min. Fonts: 10 min. If the admin sits on the wizard for an hour and then hits upload, it fails. Request the URL immediately before uploading, not when the wizard step first renders.

## 0.3 Two buckets — and which one you can actually display

| Asset | Bucket | What gets stored in the DB | Can you `<img src>` it? |
|---|---|---|---|
| Comic thumbnails | **public** | full public URL | ✅ **Yes** |
| Country flags | **public** | full public URL | ✅ **Yes** |
| Page artwork | **private** | the raw R2 **key** | ❌ **No** |
| Page masks | **private** | the raw R2 **key** | ❌ **No** |
| Fonts (.ttf/.otf) | **private** | the raw R2 **key** | ❌ **No** |

This asymmetry matters a lot and is the source of the two known blockers in §8. Read that section before you plan the page-artwork and bubble-mapper screens.

## 0.4 Auth

- All `/api/admin/*` routes require a **Better Auth session cookie** belonging to a user whose `role === "ADMIN"`.
- There is **no bearer token, no API key**. It is cookie-only.
- Every request to our backend must send `credentials: "include"` (fetch) or `withCredentials: true` (axios). If you forget this, every admin call returns 401.
- Roles are assigned manually in the DB. There is no "make me admin" endpoint.
- `/api/public/*` needs no auth at all.

**Health check for your auth wiring:** `GET /api/admin/status` → `{ success: true, message: "Admin router is active and guarded.", adminEmail: "..." }`. Hit this first when debugging; if it 401s, your cookie isn't reaching the server.

**CORS is currently locked to `http://localhost:3000` only** (`app.ts:32`), with `credentials: true`. When you deploy to a real URL, tell backend and it gets added. Until then, developing on any other port will fail CORS.

## 0.5 Response envelope — every response, no exceptions

**Success** (`2xx`):
```json
{
  "success": true,
  "message": "optional, not always present",
  "data": { }
}
```
The real payload is **always** under `data`. Write one response interceptor that unwraps `.data.data` and be done with it.

**Error** (`4xx`/`5xx`):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "human-readable string, safe to show in a toast"
  }
}
```

Error codes you will encounter:

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad body, missing field, value out of range, business-rule violation (e.g. publishing without a thumbnail) |
| 401 | `UNAUTHORIZED` | No session cookie / not logged in |
| 403 | `FORBIDDEN` | Logged in but `role !== "ADMIN"` |
| 404 | `NOT_FOUND` | Comic/page/bubble/font/theme/country ID doesn't exist |
| 409 | `CONFLICT` | Duplicate (page number, country code, theme name) **or** a delete blocked by a dependency |
| 500 | `INTERNAL_SERVER_ERROR` | Bug. In production the message is masked to `"An unexpected error occurred on the server."` |

**DELETE endpoints return `204 No Content` with an empty body.** Do not try to parse JSON from a successful delete — you'll throw.

## 0.6 Two validation-error message formats (annoying but real)

Most endpoints validate in middleware and produce a **path-prefixed** message:
```
"Validation failed - title: Title cannot be empty, pricing: You must provide at least one pricing rule for the comic."
```

A handful validate inside the controller and produce a **bare joined** message with no field paths:
```
"Invalid content type. Only PNG, JPEG, and WEBP images are allowed for thumbnails."
```

Endpoints in the second group: **batch thumbnail upload-url**, **country flag upload-url**, **country create**, **country update**, and both **public comic list/detail** (query validation).

Practical advice: don't try to map errors back to specific form fields by parsing the string. Do your own client-side validation with the same rules documented below, and treat the server message as a fallback toast.

---

# PART 1 — PREREQUISITES (must exist before any comic can be created)

`POST /api/admin/comics` **requires at least one pricing rule**, and a pricing rule requires a `countryId`. So countries must exist first. Themes are optional but you'll want them for the dropdown.

## 1.1 Countries

### `GET /api/admin/countries`
Also used to populate the pricing-matrix rows in the comic wizard.

**Request:** none.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "b1e6...-uuid",
      "code": "IN",
      "name": "India",
      "currencyCode": "INR",
      "flagUrl": "https://pub-xxxx.r2.dev/flags/9f2c...-in.png",
      "isActive": true
    }
  ]
}
```
Sorted by `name` ascending. Note: **no `createdAt`/`updatedAt`** on this model.

---

### `POST /api/admin/countries/upload-url`
Step 1 of the flag upload.

**Request body:**
```json
{
  "fileName": "india-flag.png",
  "contentType": "image/png"
}
```
| Field | Rules |
|---|---|
| `fileName` | string, min 1. Sanitized server-side (non-alphanumerics → `_`). |
| `contentType` | must match `^image/(png\|jpeg\|jpg\|svg\+xml\|webp)$` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Presigned upload URL generated successfully",
  "data": {
    "uploadUrl": "https://<account>.r2.cloudflarestorage.com/unilake-public/flags/...?X-Amz-Signature=...",
    "key": "flags/9f2c1a44-...-india-flag.png"
  }
}
```
Expires in **15 minutes**. Bucket: **public**.

---

### `POST /api/admin/countries`

**Request body:**
```json
{
  "code": "IN",
  "name": "India",
  "currencyCode": "INR",
  "flagKey": "flags/9f2c1a44-...-india-flag.png"
}
```
| Field | Rules |
|---|---|
| `code` | **required**, must be a real ISO 3166-1 alpha-2 code — validated against a hardcoded 249-entry list. Uppercase. |
| `name` | **required**, 1–100 chars |
| `currencyCode` | **required**, must be a real ISO 4217 code — validated against a hardcoded list |
| `flagKey` | **required**, the `key` from the upload-url call |

The backend converts `flagKey` → a full public URL and stores it as `flagUrl`.

**Response `201`:** the created country row (same shape as the list item above).

**`409 CONFLICT`** if the country `code` already exists: `"A country with the code 'IN' already exists."`

---

### `PUT /api/admin/countries/:countryId`
Note: **PUT**, not PATCH. But the body is **partial** — send only what changed.

**Request body:** any subset of `{ code, name, currencyCode, flagKey }`, same rules as create. Sending `{}` → `400 "No valid fields provided for update."`

If you send a new `flagKey`, the flag URL is replaced. ⚠️ **The old flag file is NOT deleted from R2.** Harmless, just orphaned.

**Response `200`:** updated country row.

---

### `DELETE /api/admin/countries/:countryId`

**Response `204`**, empty body.

**`409 CONFLICT`** if any pricing rule references it:
`"Cannot delete country \"India\" — 12 pricing rule(s) reference it. Remove the pricing rules first."`

Show this message verbatim; it contains the count the admin needs.

---

## 1.2 Themes

### `GET /api/public/themes`
⚠️ **The theme list endpoint lives on the PUBLIC router, not admin.** There is no `GET /api/admin/themes`. Use the public one in the admin panel too — it needs no auth.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Space Adventure", "createdAt": "2026-07-01T...", "updatedAt": "2026-07-01T..." }
  ]
}
```
Sorted by `name` ascending.

### `POST /api/admin/themes`
**Body:** `{ "name": "Space Adventure" }` — trimmed, min 1 char, must be globally unique.
**Response `201`:** the theme row.
**`409`:** `"A theme with the name \"Space Adventure\" already exists"`

### `PATCH /api/admin/themes/:themeId`
**Body:** `{ "name": "New Name" }` — `name` is **required** (this is not a partial patch).
**Response `200`:** updated theme. **`404`** if not found, **`409`** on duplicate name.

### `DELETE /api/admin/themes/:themeId`
**Response `204`.**
**`409`** if comics are linked: `"Cannot delete theme \"Space Adventure\" — it still has 3 comic(s) linked to it. Unlink them first."`

---

# PART 2 — THE COMIC UPLOAD WIZARD

This is the core of the work. Six steps, in this order.

```
 STEP 1   Upload thumbnails            → get keys
 STEP 2   Create the comic (+ pricing) → get comicId          ⚑ comicId unlocks everything below
 STEP 3   Upload fonts                 → get fontIds
 STEP 4   For each page: upload artwork + mask, create page → get pageIds
 STEP 5   For each page: draw + create bubbles (needs fontIds + pageIds)
 STEP 6   Publish
```

**Design the wizard so `comicId` is persisted (URL param or store) the moment step 2 succeeds.** If the admin refreshes at step 4, you must be able to resume — the comic already exists in DRAFT. Reload state with `GET /api/admin/comics/:comicId` (§2.7), which returns the whole tree.

---

## STEP 1 — Thumbnails

A comic has **1 to 10** thumbnails. **The first element of the array is the primary** — it's what shows on catalogue cards. The whole array shows on the detail page. Order is meaningful, so give the admin drag-to-reorder.

### `POST /api/admin/comics/thumbnails/upload-urls`

One call for all thumbnails. There is **no single-file variant** — for one file, send an array of one.

**Request body:**
```json
{
  "files": [
    { "fileName": "cover-front.png",  "contentType": "image/png" },
    { "fileName": "cover-back.jpg",   "contentType": "image/jpeg" }
  ]
}
```
| Field | Rules |
|---|---|
| `files` | array, **min 1, max 10** |
| `files[].fileName` | string, min 1 |
| `files[].contentType` | must match `^image/(png\|jpeg\|jpg\|webp)$` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Presigned thumbnail upload URLs generated successfully",
  "data": {
    "uploads": [
      { "uploadUrl": "https://...signed...", "key": "comics/temp/9f2c...-cover-front.png" },
      { "uploadUrl": "https://...signed...", "key": "comics/temp/a71d...-cover-back.jpg" }
    ]
  }
}
```

⚠️ Note the nesting: `response.data.uploads`, not `response.data`.

**`uploads[i]` corresponds to `files[i]` by index** — the backend uses `Promise.all` over your array and preserves order. Zip them back together by index.

Expiry **15 minutes**. Bucket: **public**.

### Then, per file:
```
PUT uploads[i].uploadUrl   with the File, Content-Type: files[i].contentType
```

### Then hold onto the keys in array order:
```ts
const thumbnailKeys = uploads.map(u => u.key);  // order = display order, [0] is primary
```

**Errors:**
- 11+ files → `400 "Maximum 10 thumbnails per request"`
- 0 files → `400 "At least one file is required"`
- `"image/gif"` → `400 "Invalid content type. Only PNG, JPEG, and WEBP images are allowed for thumbnails."`

---

## STEP 2 — Create the comic

This single call creates the comic **and all its pricing rules** in one database transaction. It's all-or-nothing.

### `POST /api/admin/comics`

**Request body:**
```json
{
  "title": "Captain Aarav and the Lost Star",
  "genderTag": "BOY",
  "pageCount": 24,
  "freePreviewPages": 10,
  "thumbnailKeys": [
    "comics/temp/9f2c...-cover-front.png",
    "comics/temp/a71d...-cover-back.jpg"
  ],
  "pricing": [
    { "countryId": "b1e6...-uuid", "coverType": "HARDCOVER", "price": 1499 },
    { "countryId": "b1e6...-uuid", "coverType": "SOFTCOVER", "price": 999 },
    { "countryId": "c2f7...-uuid", "coverType": "HARDCOVER", "price": 29.99 },
    { "countryId": "c2f7...-uuid", "coverType": "SOFTCOVER", "price": 19.99 }
  ],
  "description": "A brave young astronaut sets out to find a fallen star.",
  "themeId": "d3a8...-uuid",
  "ageGroup": "AGE_6_8",
  "isBestseller": false
}
```

**Required fields:**

| Field | Type | Rules |
|---|---|---|
| `title` | string | 1–255 chars |
| `genderTag` | enum | exactly `"BOY"` \| `"GIRL"` \| `"UNISEX"` |
| `pageCount` | number | integer, **> 0** |
| `freePreviewPages` | number | integer, **≥ 0**, and **strictly less than `pageCount`** |
| `thumbnailKeys` | string[] | **min 1, max 10**, each non-empty. Order preserved; `[0]` is primary. |
| `pricing` | object[] | **min 1** |
| `pricing[].countryId` | string | must be a **valid UUID** and an existing country |
| `pricing[].coverType` | enum | `"HARDCOVER"` \| `"SOFTCOVER"` |
| `pricing[].price` | number | **> 0** (send a plain number, not a string) |

**Optional fields:**

| Field | Type | Rules |
|---|---|---|
| `description` | string | min 1 if present |
| `themeId` | string | valid UUID of an existing theme |
| `ageGroup` | enum | `"AGE_0_2"` \| `"AGE_3_5"` \| `"AGE_6_8"` \| `"AGE_9_12"` |
| `isBestseller` | boolean | defaults `false` |
| `loraKey`, `loraStrength` | — | ⛔ **DO NOT USE. DO NOT BUILD UI FOR THESE.** See §7. |

**Business rule to enforce client-side:** `freePreviewPages < pageCount`. The server rejects with
`"Free preview pages must be strictly less than the total page count."` but catching it in the form is much nicer.

**Pricing UX guidance:** the natural UI is a grid — countries down the side, HARDCOVER/SOFTCOVER across the top, one price input per cell. Flatten that grid into the `pricing` array on submit. The DB has a unique constraint on `[comicId, countryId, coverType]`, so never emit two entries for the same country+coverType pair (you'd get a `409`).

**Response `201`:**
```json
{
  "success": true,
  "message": "Comic catalogue item created successfully.",
  "data": {
    "id": "e4b9...-uuid",
    "title": "Captain Aarav and the Lost Star",
    "genderTag": "BOY",
    "pageCount": 24,
    "freePreviewPages": 10,
    "coverThumbnailUrls": [
      "https://pub-xxxx.r2.dev/comics/temp/9f2c...-cover-front.png",
      "https://pub-xxxx.r2.dev/comics/temp/a71d...-cover-back.jpg"
    ],
    "loraFileUrl": null,
    "loraStrength": 1,
    "status": "DRAFT",
    "publishJobId": null,
    "publishError": null,
    "isBestseller": false,
    "description": "A brave young astronaut sets out to find a fallen star.",
    "themeId": "d3a8...-uuid",
    "ageGroup": "AGE_6_8",
    "createdAt": "2026-07-28T09:12:33.120Z",
    "updatedAt": "2026-07-28T09:12:33.120Z"
  }
}
```

⚠️ **Note what's NOT in the response:** the created `pricingRules` are not returned. If you want to show them back, call `GET /api/admin/comics/:comicId/pricing` (§2.6).

⚠️ **You sent `thumbnailKeys`, you get back `coverThumbnailUrls`.** The backend converts key → full public URL. These are directly usable in `<img src>`.

⚠️ Status is always `"DRAFT"` on creation. You cannot create a published comic.

**➡️ Save `data.id` as `comicId`. Everything below needs it.**

**Errors:**
- `400` — any validation failure above.
- `409 CONFLICT` — `"A pricing rule conflict occurred, or a comic with this parameter exists."` (duplicate country+coverType in your `pricing` array).
- A non-existent `countryId` that is still a valid UUID will surface as a **500** (foreign-key violation isn't specially handled). Always source `countryId` from `GET /api/admin/countries` — never let the admin type one.

---

## STEP 3 — Fonts

Fonts are **scoped to a single comic**. A font uploaded for comic A cannot be used by a bubble in comic B (enforced — see §2.5). If two comics use the same typeface, upload it twice.

Do this **before** bubbles, because bubble creation takes a `fontId`.

### `POST /api/admin/comics/:comicId/fonts/upload-url`

**Request body:**
```json
{
  "fileName": "ComicSans-Bold",
  "fileExtension": "ttf"
}
```
| Field | Rules |
|---|---|
| `fileName` | string, min 1. ⚠️ **Currently accepted but not actually used** in the generated key — the key is timestamp-based. Send it anyway; it's required by the schema. |
| `fileExtension` | enum, exactly one of `"ttf"` \| `"otf"` \| `"woff"` \| `"woff2"` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...signed...",
    "key": "comics/e4b9-uuid/fonts/1753689153000.ttf"
  }
}
```
Expiry **10 minutes** (shorter than the others — don't stall). Bucket: **private**.

Content-Type for the PUT, by extension: `ttf → font/ttf`, `otf → font/otf`, `woff → font/woff`, `woff2 → font/woff2`.

**`404`** if `comicId` doesn't exist.

---

### `POST /api/admin/comics/:comicId/fonts`

**Request body:**
```json
{
  "name": "ComicSans-Bold",
  "fontKey": "comics/e4b9-uuid/fonts/1753689153000.ttf"
}
```
| Field | Rules |
|---|---|
| `name` | string, min 1. Display name shown in the font dropdown when mapping bubbles. |
| `fontKey` | string, min 1. The `key` from the upload-url call. |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "f5c0...-uuid",
    "comicId": "e4b9...-uuid",
    "name": "ComicSans-Bold",
    "fileUrl": "comics/e4b9-uuid/fonts/1753689153000.ttf",
    "createdAt": "2026-07-28T09:20:00.000Z"
  }
}
```

⚠️ **`fileUrl` is the private R2 key, not a URL, despite the name.** You cannot `@font-face` it. See §8.2.

**➡️ Save `data.id` as `fontId` per font.**

---

### `GET /api/admin/comics/:comicId/fonts`
Use this to populate the font dropdown in the bubble mapper, and to render the font-management screen.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f5c0...-uuid",
      "comicId": "e4b9...-uuid",
      "name": "ComicSans-Bold",
      "fileUrl": "comics/e4b9-uuid/fonts/1753689153000.ttf",
      "createdAt": "2026-07-28T09:20:00.000Z",
      "_count": { "bubbles": 47 }
    }
  ]
}
```
Sorted by `createdAt` ascending. `_count.bubbles` = how many bubbles use this font — show it, and use it to grey out the delete button.

---

### `PATCH /api/admin/fonts/:fontId`
⚠️ Path is `/api/admin/fonts/:fontId` — **not** nested under the comic.

**Request body:** at least one of:
```json
{ "name": "ComicSans-Regular", "fontKey": "comics/.../fonts/1753699999000.ttf" }
```
Empty body `{}` → `400 "At least one field must be provided"`.

To replace the font file: run upload-url → PUT → PATCH with the new `fontKey`. ⚠️ The old file is not deleted from R2.

**Response `200`:** the updated font row (no `_count`).

---

### `DELETE /api/admin/fonts/:fontId`
**Response `204`.**
**`409`** if bubbles reference it:
`"Cannot delete font \"ComicSans-Bold\" — 47 bubble(s) reference it. Unassign the font from those bubbles first."`

---

## STEP 4 — Pages

One record per physical page of the book. Each page has up to two image assets:

- **`artworkUrl`** — the base illustration with **empty speech bubbles**. Required in practice for any page you want to generate or preview.
- **`maskUrl`** — a PNG marking the head region where the child's face gets composited. Only meaningful when `hasFace: true`.

Both are **optional at create time** — you can create the page row first and PATCH the assets in later. That's a useful pattern if uploads are slow.

### 4a. `POST /api/admin/comics/:comicId/pages/upload-url`

Call this **twice per page** — once for artwork, once for the mask.

**Request body:**
```json
{
  "fileExtension": "png",
  "fileType": "artwork"
}
```
| Field | Rules |
|---|---|
| `fileExtension` | enum, exactly `"jpg"` \| `"jpeg"` \| `"png"` \| `"webp"` |
| `fileType` | enum, exactly `"artwork"` \| `"masks"` — ⚠️ note the **plural** on `"masks"`. `"mask"` is rejected. |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...signed...",
    "key": "comics/e4b9-uuid/pages/artwork/1753689200000.png"
  }
}
```
Expiry **15 minutes**. Bucket: **private**.

Content-Type mapping for the PUT: `jpg → image/jpeg`, `jpeg → image/jpeg`, `png → image/png`, `webp → image/webp`. Note `jpg` maps to `image/jpeg` — send `image/jpeg`, not `image/jpg`.

⚠️ **The key is `Date.now()`-based with no random component.** Two upload-url requests fired in the same millisecond for the same comic+type produce the same key and the second upload silently overwrites the first. If you build "upload all 24 pages at once," **stagger the upload-url calls or await them sequentially** — do not `Promise.all` 24 of them.

**`404`** if `comicId` doesn't exist.

---

### 4b. `POST /api/admin/comics/:comicId/pages`

**Request body:**
```json
{
  "pageNumber": 1,
  "artworkUrl": "comics/e4b9-uuid/pages/artwork/1753689200000.png",
  "maskUrl": "comics/e4b9-uuid/pages/masks/1753689201000.png",
  "hasFace": true,
  "mirrorFace": false,
  "faceDirection": "front",
  "isPreviewPage": true,
  "pagePrompt": "A boy in a spacesuit floating near a glowing star",
  "steps": 3,
  "cfg": 1.0
}
```

| Field | Required | Type | Rules / meaning |
|---|---|---|---|
| `pageNumber` | ✅ | number | integer, **> 0**. **Unique within the comic** — duplicates → `409`. |
| `artworkUrl` | ❌ | string | min 1. The `key` from upload-url with `fileType: "artwork"`. |
| `maskUrl` | ❌ | string | min 1. The `key` from upload-url with `fileType: "masks"`. |
| `hasFace` | ❌ | boolean | **defaults `false`**. Does the child's face appear on this page? |
| `mirrorFace` | ❌ | boolean | **defaults `false`**. Should the face be horizontally flipped? |
| `faceDirection` | ❌ | string | enum `"front"` \| `"three-quarter"` \| `"side"`. Only meaningful if `hasFace`. |
| `isPreviewPage` | ❌ | boolean | **defaults `false`**. Is this part of the free preview? **This is what the public detail endpoint filters on.** |
| `pagePrompt` | ❌ | string | min 1. Per-page generation prompt. Free text. |
| `steps` | ❌ | number | integer, **1–8**. Omit → DB default **3**. |
| `cfg` | ❌ | number | float, **1.0–3.0**. Omit → DB default **1.0**. |

**On `steps` and `cfg`:** these are AI-generation tuning knobs. Put them behind an "Advanced" collapsible with the defaults pre-filled and a warning that changing them affects output quality. Most admins should never touch them. Values outside the range are rejected with a 400.

**On `isPreviewPage` vs `freePreviewPages`:** these are **two independent, uncoordinated fields.** `Comic.freePreviewPages` is a number (e.g. 10). `Page.isPreviewPage` is a per-page boolean. **The backend does not check that they agree.** You can set `freePreviewPages: 10` and flag 3 pages as preview, and nothing complains — but the user-facing detail page will only show those 3. **Build a client-side check that the count of `isPreviewPage: true` pages equals `freePreviewPages`, and warn the admin before publish.**

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "a9d2...-uuid",
    "comicId": "e4b9...-uuid",
    "pageNumber": 1,
    "artworkUrl": "comics/e4b9-uuid/pages/artwork/1753689200000.png",
    "maskUrl": "comics/e4b9-uuid/pages/masks/1753689201000.png",
    "hasFace": true,
    "mirrorFace": false,
    "faceDirection": "front",
    "isPreviewPage": true,
    "pagePrompt": "A boy in a spacesuit floating near a glowing star",
    "steps": 3,
    "cfg": 1,
    "createdAt": "2026-07-28T09:25:00.000Z",
    "updatedAt": "2026-07-28T09:25:00.000Z"
  }
}
```

**➡️ Save `data.id` as `pageId`. Bubbles attach to this.**

**`409`** on duplicate: `"Page number 1 already exists for this comic"`.

⚠️ **Nothing enforces that you create exactly `pageCount` pages.** You can declare `pageCount: 24` and upload 3. The publish gate does not check this either. **Add a client-side completeness check before publish** — see §2.8.

---

### 4c. `GET /api/admin/comics/:comicId/pages`

The workhorse for the page-management screen and for resuming an interrupted wizard. Returns pages **with their bubbles nested**, and each bubble's font info.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a9d2...-uuid",
      "comicId": "e4b9...-uuid",
      "pageNumber": 1,
      "artworkUrl": "comics/e4b9-uuid/pages/artwork/1753689200000.png",
      "maskUrl": "comics/e4b9-uuid/pages/masks/1753689201000.png",
      "hasFace": true,
      "mirrorFace": false,
      "faceDirection": "front",
      "isPreviewPage": true,
      "pagePrompt": "A boy in a spacesuit...",
      "steps": 3,
      "cfg": 1,
      "createdAt": "...",
      "updatedAt": "...",
      "bubbles": [
        {
          "id": "c7e1...-uuid",
          "pageId": "a9d2...-uuid",
          "x": 120.5,
          "y": 340,
          "width": 280,
          "height": 90,
          "dialogue": "Look, {name}! A shooting star!",
          "fontId": "f5c0...-uuid",
          "fontSize": 28,
          "sortOrder": 0,
          "createdAt": "...",
          "updatedAt": "...",
          "font": { "id": "f5c0...-uuid", "name": "ComicSans-Bold" }
        }
      ]
    }
  ]
}
```
Pages sorted by `pageNumber` ascending; bubbles sorted by `sortOrder` ascending.

**`404`** if `comicId` doesn't exist.

---

### 4d. `PATCH /api/admin/pages/:pageId`
⚠️ Path is `/api/admin/pages/:pageId` — **not** nested under the comic.

**Request body:** any subset of the fields below. **At least one required** — `{}` → `400 "At least one field must be provided"`.

| Field | Type | Note |
|---|---|---|
| `hasFace` | boolean | |
| `mirrorFace` | boolean | |
| `faceDirection` | string \| **null** | nullable — send `null` to clear |
| `isPreviewPage` | boolean | |
| `pagePrompt` | string \| **null** | nullable — send `null` to clear |
| `artworkUrl` | string | replaces the artwork key |
| `maskUrl` | string | replaces the mask key |
| `steps` | number | int, 1–8 |
| `cfg` | number | float, 1.0–3.0 |

⚠️ **`pageNumber` cannot be changed.** It's not in the update schema. To renumber a page you must delete and recreate it (which destroys its bubbles). Do **not** build a "reorder pages" feature — it isn't supported by the API.

⚠️ Replacing `artworkUrl`/`maskUrl` does **not** delete the old file from R2.

**Response `200`:** the full updated page row (no nested bubbles).

---

### 4e. `DELETE /api/admin/pages/:pageId`
**Response `204`.**

⚠️ **This cascade-deletes every bubble on the page.** No confirmation from the backend, no 409 guard. Put a hard confirm dialog in front of it that names the bubble count.

---

## STEP 5 — Bubbles (the bubble mapper)

This is the most involved screen. The admin sees the page artwork, drags rectangles over each empty speech bubble, and types the dialogue template into each.

### The coordinate system — read this carefully

`x`, `y`, `width`, `height` are stored as **raw `Float` values with no units, no reference resolution, and no scaling metadata.** The backend accepts whatever numbers you send.

The backend will later use these coordinates to composite text onto the **full-resolution artwork** with Sharp. If the admin drew rectangles on a browser-scaled image (say the artwork is 2048px wide but displayed at 800px), and you send the on-screen pixel values, the text lands in the wrong place.

**➡️ Convention you must follow: always send coordinates in the artwork's NATURAL pixel space.**

```ts
// img = the <img> element displaying the artwork
const scaleX = img.naturalWidth  / img.clientWidth;
const scaleY = img.naturalHeight / img.clientHeight;

const payload = {
  x:      rect.x      * scaleX,
  y:      rect.y      * scaleY,
  width:  rect.width  * scaleX,
  height: rect.height * scaleY,
};
```
`x`/`y` are the **top-left corner** of the rectangle. Origin is top-left of the image.

⚠️ **There is currently no field on `Page` storing the artwork's dimensions**, so the backend cannot verify or re-scale your coordinates. This is a known open item on the backend side. Until it's resolved, the natural-pixel-space convention above is the contract. **Confirm this convention with backend before you ship the mapper** — it must match what Sharp does.

### The dialogue token system

`dialogue` is a **template**, not final text. It may contain these tokens, which the backend substitutes per-child at generation time:

| Token | Replaced with |
|---|---|
| `{name}` | The child's first name |
| `{pronoun_subject}` | he / she / they |
| `{pronoun_object}` | him / her / them |
| `{pronoun_possessive}` | his / her / their |

Example: `"Look, {name}! {pronoun_subject} found it!"`

**UX guidance:** give the admin an insert-token toolbar rather than making them type braces. Also render a live preview with sample values substituted (e.g. name = "Aarav", he/him) so they can sanity-check line length against the rectangle they drew. **Token names are not validated by the backend** — a typo like `{Name}` or `{pronoun}` is accepted and will render literally in the final book. A client-side lint that flags unknown `{...}` tokens is worth building.

---

### `POST /api/admin/pages/:pageId/bubbles`

**Request body:**
```json
{
  "x": 120.5,
  "y": 340,
  "width": 280,
  "height": 90,
  "dialogue": "Look, {name}! A shooting star!",
  "fontId": "f5c0...-uuid",
  "fontSize": 28,
  "sortOrder": 0
}
```

| Field | Required | Type | Rules |
|---|---|---|---|
| `x` | ✅ | number | any float, can be negative or 0 |
| `y` | ✅ | number | any float, can be negative or 0 |
| `width` | ✅ | number | **> 0** |
| `height` | ✅ | number | **> 0** |
| `dialogue` | ✅ | string | min 1 char |
| `fontId` | ❌ | string | valid UUID of a font. **Omit if none.** |
| `fontSize` | ❌ | number | integer, **> 0**. **Defaults to `24`.** |
| `sortOrder` | ❌ | number | integer. **Defaults to `0`.** Controls list order. |

⚠️ **`fontId` is NOT validated for comic ownership on CREATE.** You can pass a font belonging to a different comic and it will be accepted. (The *update* endpoint does check — see below.) **Only ever populate the font dropdown from `GET /api/admin/comics/:comicId/fonts`.** Never let a global font list leak into this picker.

⚠️ **`fontId` must be omitted entirely if there's no font — do not send `null`.** The create schema is `.uuid().optional()` with no `.nullable()`, so `null` → `400`. (The *update* schema does accept `null`.)

**`sortOrder` guidance:** assign sequentially as bubbles are added (`0, 1, 2, …`). It has no effect on rendering position — that's what x/y are for — but it gives a stable, predictable order in lists and debug output.

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "c7e1...-uuid",
    "pageId": "a9d2...-uuid",
    "x": 120.5,
    "y": 340,
    "width": 280,
    "height": 90,
    "dialogue": "Look, {name}! A shooting star!",
    "fontId": "f5c0...-uuid",
    "fontSize": 28,
    "sortOrder": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
⚠️ The create response does **not** include the nested `font` object (list and update responses do).

**`404`** if `pageId` doesn't exist.

---

### `GET /api/admin/pages/:pageId/bubbles`

**Response `200`:** array of bubbles sorted by `sortOrder` ascending, each with a nested `font: { id, name } | null`.

You often won't need this — `GET /api/admin/comics/:comicId/pages` already nests bubbles. Use this one only when you're working on a single page and want a lighter payload.

---

### `PATCH /api/admin/bubbles/:bubbleId`
⚠️ Path is `/api/admin/bubbles/:bubbleId` — top-level.

**Request body:** any subset. At least one field required — `{}` → `400 "At least one field must be provided"`.

| Field | Type | Rules |
|---|---|---|
| `x`, `y` | number | any float |
| `width`, `height` | number | > 0 |
| `dialogue` | string | min 1 |
| `fontId` | string \| **null** | valid UUID, **or `null` to unassign the font** |
| `fontSize` | number | int, > 0 |
| `sortOrder` | number | int, **≥ 0** (note: create allows negative, update does not) |

✅ **Here the cross-comic font check IS enforced.** If `fontId` belongs to a different comic:
`409 "Font does not belong to the same comic as this bubble"`.
If the font doesn't exist at all: `404 "Font not found"`.

This is the endpoint you'll call on every drag/resize in the mapper. **Debounce it** (~300–500ms) so a drag doesn't fire 60 requests.

**Response `200`:** the updated bubble **with nested `font: { id, name } | null`**.

---

### `DELETE /api/admin/bubbles/:bubbleId`
**Response `204`.** No guards, deletes immediately.

---

## STEP 6 — Publish

### `PATCH /api/admin/comics/:comicId/status`

**Request body:**
```json
{ "status": "PUBLISHED" }
```
`status` must be exactly one of `"DRAFT"` | `"PUBLISHED"` | `"UNPUBLISHED"`.

**Publish is a synchronous database flip.** It returns immediately. There is **no background job, no progress bar, no polling, no websocket event.** Do not build a "publishing…" progress UI. A button with a brief spinner while the request is in flight is exactly right.

**Server-side gates when `status === "PUBLISHED"`:**
1. `coverThumbnailUrls.length > 0` → else `400 "Cannot publish comic: at least one cover thumbnail is required."`
2. `pricingRules.length > 0` → else `400 "Cannot publish comic: At least one pricing rule is required."`

**That is the entire gate.** It does **not** check that pages exist, that artwork was uploaded, that bubbles were mapped, or that page count matches. **You must build a client-side pre-publish checklist** — see §2.8.

Switching to `DRAFT` or `UNPUBLISHED` has no gates.

**Response `200`:**
```json
{
  "success": true,
  "message": "Comic status successfully changed to PUBLISHED.",
  "data": { /* full comic row, status now "PUBLISHED" */ }
}
```

⚠️ **The DB enum also contains `"PUBLISHING"`** (a leftover from a removed async flow). Nothing sets it, but if you write an exhaustive `switch` on status, include a defensive branch so an unexpected value doesn't blank the UI.

---

## 2.6 Managing an existing comic

### `PATCH /api/admin/comics/:comicId`
The single unified endpoint for editing every plain comic field. **Not** for pricing (§2.6b) and **not** for status (§2.8).

**Request body:** any subset. At least one field required — `{}` → `400 "At least one field must be provided to update"`.

| Field | Type | Rules |
|---|---|---|
| `title` | string | min 1 |
| `genderTag` | enum | BOY / GIRL / UNISEX |
| `pageCount` | number | int, > 0 |
| `freePreviewPages` | number | int, **> 0** ⚠️ |
| `thumbnailKeys` | string[] | min 1, max 10 |
| `description` | string | min 1 |
| `themeId` | string | valid UUID |
| `ageGroup` | enum | AGE_0_2 / AGE_3_5 / AGE_6_8 / AGE_9_12 |
| `isBestseller` | boolean | |
| `loraKey`, `loraStrength` | — | ⛔ do not use |

**Two inconsistencies vs. create — know them:**
1. On **create**, `freePreviewPages` allows `0`. On **update**, it must be `> 0`. So a comic created with `freePreviewPages: 0` cannot be updated back to `0`.
2. On **update**, the `freePreviewPages < pageCount` rule is **NOT enforced**. You can PATCH `freePreviewPages: 50` onto a 24-page comic and it succeeds. **Enforce this client-side on the edit form.**

⚠️ **`themeId` cannot be unset.** Internally it does `theme: { connect: { id } }`, and the schema doesn't accept `null`. Once a theme is attached there is no API to remove it — only to switch it to a different theme. Don't build a "clear theme" option.

### `thumbnailKeys` on update — the full-replacement rule

**You send the FULL desired array, every time.** There are no add/remove sub-endpoints. The backend:
1. Converts your keys to public URLs and **replaces** `coverThumbnailUrls` wholesale.
2. Diffs old vs new, and **best-effort deletes the removed files from R2**.

**Consequence:** to keep an existing thumbnail, you must re-send its key. But `GET` returns full **URLs**, not keys. So you must derive the key back from the URL:

```ts
// PUBLIC_URL_BASE must match the backend's R2 public base exactly.
// Ask backend for the value; don't hardcode a guess.
const keyFromUrl = (url: string) =>
  url.replace(`${PUBLIC_URL_BASE.replace(/\/$/, "")}/`, "");
```

Then the update flow for "add one thumbnail, remove one, keep two" is:
```ts
const existingKeys = comic.coverThumbnailUrls.map(keyFromUrl);   // ["a","b","c"]
const kept         = existingKeys.filter(k => k !== "b");        // ["a","c"]
const newKeys      = [...kept, "comics/temp/new-one.png"];       // ["a","c","new"]
await patchComic(comicId, { thumbnailKeys: newKeys });           // "b" is deleted from R2
```

⚠️ **Getting this wrong deletes files.** If you send only the one new key, the other three are permanently removed from R2. Test this path carefully.

⚠️ **The array order you send becomes the new display order**, and `[0]` becomes the primary thumbnail. Reordering is just a PATCH with the same keys in a different order.

**Response `200`:** the updated comic row. No `message` field on this one.

---

### 2.6b `GET /api/admin/comics/:comicId/pricing`

**Response `200`:**
```json
{
  "success": true,
  "message": "Pricing rules fetched successfully.",
  "data": [
    {
      "id": "p1a2...-uuid",
      "comicId": "e4b9...-uuid",
      "countryId": "b1e6...-uuid",
      "coverType": "HARDCOVER",
      "price": "1499.00",
      "createdAt": "...",
      "updatedAt": "...",
      "country": {
        "id": "b1e6...-uuid",
        "name": "India",
        "code": "IN",
        "currencyCode": "INR",
        "flagUrl": "https://pub-xxxx.r2.dev/flags/..."
      }
    }
  ]
}
```
Sorted by country name ascending.

🔴 **`price` comes back as a STRING, not a number.** It's a Postgres `DECIMAL(10,2)` and Prisma serializes it as a string to avoid float precision loss. So:
- Reading: `"1499.00"` — you must `parseFloat()` before doing math, or better, format it as-is for display.
- Writing: you must send a **number** (`1499`), because Zod validates `z.number()`. Sending `"1499"` → `400`.

This asymmetry (read string, write number) will bite you. Handle it in one place in your API layer.

**`404`** if the comic doesn't exist.

---

### 2.6c `PUT /api/admin/comics/:comicId/pricing`

**Full replacement.** In one transaction the backend deletes **every** existing pricing rule for the comic and inserts exactly what you send. There is no partial update.

**Request body:**
```json
{
  "pricing": [
    { "countryId": "b1e6...-uuid", "coverType": "HARDCOVER", "price": 1599 },
    { "countryId": "b1e6...-uuid", "coverType": "SOFTCOVER", "price": 1099 }
  ]
}
```
Same field rules as create. `pricing` min 1.

⚠️ **Anything you omit is deleted.** Always load the current rules with the GET, edit the whole grid in local state, and PUT the complete set back.

**Response `200`:**
```json
{
  "success": true,
  "message": "Pricing rules fully replaced.",
  "data": { /* full comic row, plus "pricingRules": [ ...raw rules, no country nested... ] }
}
```
Note the response's nested `pricingRules` does **not** include the `country` object — re-fetch with the GET if you need country names.

---

### 2.6d `DELETE /api/admin/comics/:comicId`

**Response `204`.**

**Two hard guards:**
1. **`409`** if `status === "PUBLISHED"`: `"Cannot delete a published comic. Unpublish it first."`
2. **`409`** if there are non-terminal order sessions: `"Cannot delete this comic — it has 3 active order session(s). Wait for them to complete or fail first."`

On success the backend best-effort deletes all thumbnails from R2, then cascade-deletes all pages → bubbles, fonts, and pricing rules. This is **destructive and irreversible.** Require a type-the-title-to-confirm dialog.

⚠️ Page artwork, masks, and font files in the **private** bucket are **not** cleaned up on comic delete. They're orphaned. Not your problem, but don't be surprised.

---

## 2.7 Listing and loading comics (admin)

### `GET /api/admin/comics`
The admin comic list screen. Returns **all comics regardless of status** (unlike the public endpoint).

**Query parameters** — all optional, all validated:

| Param | Rules |
|---|---|
| `gender` | `BOY` \| `GIRL` \| `UNISEX` |
| `ageGroup` | `AGE_0_2` \| `AGE_3_5` \| `AGE_6_8` \| `AGE_9_12` |
| `themeId` | valid UUID |
| `search` | free text — case-insensitive **substring** match on `title` |

Example: `GET /api/admin/comics?gender=BOY&ageGroup=AGE_6_8&search=star`

⚠️ **Don't send empty-string params.** `?themeId=` → `400 "Invalid theme ID"`. Strip empty values before building the query string. (`search=""` is safe — it's treated as absent — but the others are not.)

⚠️ **There is no pagination.** Every comic is returned in one array. Fine for now; paginate client-side.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "e4b9...-uuid",
      "title": "Captain Aarav and the Lost Star",
      "genderTag": "BOY",
      "pageCount": 24,
      "freePreviewPages": 10,
      "coverThumbnailUrls": ["https://pub-xxxx.r2.dev/comics/temp/...png"],
      "loraFileUrl": null,
      "loraStrength": 1,
      "status": "DRAFT",
      "publishJobId": null,
      "publishError": null,
      "isBestseller": false,
      "description": "...",
      "themeId": "d3a8...-uuid",
      "ageGroup": "AGE_6_8",
      "createdAt": "...",
      "updatedAt": "...",
      "theme": { "id": "d3a8...-uuid", "name": "Space Adventure" },
      "_count": { "pages": 24, "orderSessions": 0, "pricingRules": 4 }
    }
  ]
}
```
Sorted by `createdAt` **descending** (newest first).

**`_count` is your friend.** Use it to render completeness badges on the list — e.g. show a warning chip when `_count.pages !== pageCount`, and disable delete when `_count.orderSessions > 0`.

---

### `GET /api/admin/comics/:comicId`
**The single most useful endpoint in the admin panel.** Returns the entire comic tree in one call. Use it to hydrate the edit screen and to resume a half-finished wizard.

**Response `200`:** the full comic row, plus:

```json
{
  "success": true,
  "data": {
    "...all comic scalar fields...": "",
    "theme": { "id": "...", "name": "Space Adventure" },
    "pages": [
      {
        "...all page fields...": "",
        "bubbles": [ { "...all bubble fields..." } ]
      }
    ],
    "fonts": [
      { "id": "...", "comicId": "...", "name": "ComicSans-Bold", "fileUrl": "comics/.../fonts/....ttf", "createdAt": "..." }
    ],
    "pricingRules": [
      {
        "id": "...", "comicId": "...", "countryId": "...",
        "coverType": "HARDCOVER", "price": "1499.00",
        "createdAt": "...", "updatedAt": "...",
        "country": { "id": "...", "code": "IN", "name": "India", "currencyCode": "INR", "flagUrl": "https://..." }
      }
    ],
    "_count": { "orderSessions": 0 }
  }
}
```

Ordering: `pages` by `pageNumber` asc; each page's `bubbles` by `sortOrder` asc; `pricingRules` by country name asc.

⚠️ Unlike `GET /pages`, the bubbles nested here **do NOT include the `font` object** — only the raw `fontId`. Join against the top-level `fonts` array yourself (they're all in the same response).

**`404`** if not found.

---

## 2.8 The pre-publish checklist you must build client-side

The server's publish gate checks only two things. Everything else is on you. Before enabling the Publish button, verify:

| # | Check | Data source | Severity |
|---|---|---|---|
| 1 | At least 1 thumbnail | `coverThumbnailUrls.length > 0` | 🔴 server-enforced |
| 2 | At least 1 pricing rule | `pricingRules.length > 0` | 🔴 server-enforced |
| 3 | Every active country has **both** HARDCOVER and SOFTCOVER priced | cross-ref `pricingRules` × `countries` | 🟠 your job |
| 4 | `_count.pages === pageCount` | admin detail | 🟠 your job |
| 5 | Page numbers are contiguous `1..pageCount`, no gaps | `pages[].pageNumber` | 🟠 your job |
| 6 | Every page has a non-null `artworkUrl` | `pages[].artworkUrl` | 🟠 your job |
| 7 | Every page with `hasFace: true` has a non-null `maskUrl` | `pages[]` | 🟠 your job |
| 8 | Count of `isPreviewPage: true` pages === `freePreviewPages` | `pages[]` vs comic | 🟠 your job |
| 9 | Every bubble has a `fontId` (or the admin explicitly accepted the default) | `pages[].bubbles[]` | 🟡 advisory |
| 10 | No bubble `dialogue` contains an unrecognized `{token}` | regex over dialogue | 🟡 advisory |
| 11 | No bubble rectangle extends outside the artwork bounds | needs artwork dims | 🟡 advisory |

Items 3–8 are the ones that will actually cause a broken book to reach a customer. Treat them as blocking.

---

# PART 3 — THE USER-FACING SIDE

Two endpoints. No auth. Both only ever return comics with `status === "PUBLISHED"` — drafts and unpublished comics are invisible here.

## 3.1 `GET /api/public/comics` — catalogue / browse

**Query parameters** — all optional:

| Param | Rules |
|---|---|
| `gender` | `BOY` \| `GIRL` \| `UNISEX` |
| `ageGroup` | `AGE_0_2` \| `AGE_3_5` \| `AGE_6_8` \| `AGE_9_12` |
| `themeId` | valid UUID |
| `search` | case-insensitive substring match on `title` |

Same empty-string caveat as the admin list: `?themeId=` → `400 "Query error: Invalid theme ID"`. Strip empty params.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "e4b9...-uuid",
      "title": "Captain Aarav and the Lost Star",
      "description": "A brave young astronaut...",
      "genderTag": "BOY",
      "ageGroup": "AGE_6_8",
      "isBestseller": false,
      "pageCount": 24,
      "coverThumbnailUrls": [
        "https://pub-xxxx.r2.dev/comics/temp/9f2c...-cover-front.png",
        "https://pub-xxxx.r2.dev/comics/temp/a71d...-cover-back.jpg"
      ],
      "theme": { "id": "d3a8...-uuid", "name": "Space Adventure" },
      "pricingRules": [
        {
          "price": "1499.00",
          "coverType": "HARDCOVER",
          "country": {
            "code": "IN",
            "name": "India",
            "flagUrl": "https://pub-xxxx.r2.dev/flags/...",
            "currencyCode": "INR"
          }
        }
      ]
    }
  ]
}
```
Sorted by `createdAt` descending. No pagination.

**Building the catalogue card:**
- Cover image → `coverThumbnailUrls[0]` (**always the primary**). These are real public URLs; use them directly.
- Price → filter `pricingRules` by the user's country and pick a `coverType` (SOFTCOVER is the usual "from" price). Format `price` (a **string**) with `currencyCode`.
- Handle `coverThumbnailUrls` being an empty array defensively — the publish gate prevents it, but a comic could theoretically be published then have thumbnails removed.

**Note:** `freePreviewPages` is **not** in the list response. It's only on the detail response.

---

## 3.2 `GET /api/public/comics/:comicId` — product detail page

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "e4b9...-uuid",
    "title": "Captain Aarav and the Lost Star",
    "description": "A brave young astronaut sets out to find a fallen star.",
    "genderTag": "BOY",
    "ageGroup": "AGE_6_8",
    "isBestseller": false,
    "pageCount": 24,
    "freePreviewPages": 10,
    "coverThumbnailUrls": [ "https://...", "https://..." ],
    "theme": { "id": "d3a8...-uuid", "name": "Space Adventure" },
    "pricingRules": [
      {
        "coverType": "HARDCOVER",
        "price": "1499.00",
        "country": { "code": "IN", "name": "India", "flagUrl": "https://...", "currencyCode": "INR" }
      },
      {
        "coverType": "SOFTCOVER",
        "price": "999.00",
        "country": { "code": "IN", "name": "India", "flagUrl": "https://...", "currencyCode": "INR" }
      }
    ],
    "pages": [
      { "id": "a9d2...-uuid", "pageNumber": 1, "artworkUrl": "comics/e4b9-uuid/pages/artwork/1753689200000.png" }
    ]
  }
}
```

**`404`** — `"Comic not found or not available."` — returned both when the ID is wrong **and** when the comic exists but isn't PUBLISHED. Render the same not-found page for both.

**Building the detail page:**
- **Gallery:** iterate the whole `coverThumbnailUrls` array. `[0]` is the hero/default-selected image.
- **Price selector:** `pricingRules` contains one entry per (country × coverType). Filter to the user's country, then offer HARDCOVER/SOFTCOVER as the choice.
- **Difference from the list endpoint:** detail adds `freePreviewPages` and `pages`.

🔴 **`pages[].artworkUrl` is NOT a usable image URL.** It is a private-bucket R2 key. `<img src="comics/e4b9-uuid/pages/artwork/1753689200000.png">` will 404. See §8.1 — this is a blocker you need backend to resolve before the preview-pages carousel can be built.

The `pages` array only contains pages flagged `isPreviewPage: true`, sorted by `pageNumber` ascending. Note that this is filtered by the **boolean flag**, not by the `freePreviewPages` **number** — so if the admin flagged 3 pages but set `freePreviewPages: 10`, you get 3 pages here. Display `pages.length` for "N free preview pages", not `freePreviewPages`, if you want them to agree.

---

# PART 4 — QUICK REFERENCE: ALL COMIC-RELATED ENDPOINTS

Base URL for everything below: your backend origin (`http://localhost:8080` locally).

### Admin — requires ADMIN session cookie

| Method | Path | Body? | Returns | Used at |
|---|---|---|---|---|
| GET | `/api/admin/status` | — | `{ message, adminEmail }` | auth smoke test |
| **Countries** |
| GET | `/api/admin/countries` | — | `Country[]` | pricing grid, country mgmt |
| POST | `/api/admin/countries/upload-url` | `{fileName, contentType}` | `{uploadUrl, key}` | flag upload step 1 |
| POST | `/api/admin/countries` | `{code,name,currencyCode,flagKey}` | `Country` (201) | flag upload step 3 |
| PUT | `/api/admin/countries/:countryId` | partial country | `Country` | edit country |
| DELETE | `/api/admin/countries/:countryId` | — | 204 | delete country |
| **Themes** |
| POST | `/api/admin/themes` | `{name}` | `Theme` (201) | theme mgmt |
| PATCH | `/api/admin/themes/:themeId` | `{name}` | `Theme` | theme mgmt |
| DELETE | `/api/admin/themes/:themeId` | — | 204 | theme mgmt |
| **Comic** |
| POST | `/api/admin/comics/thumbnails/upload-urls` | `{files:[{fileName,contentType}]}` | `{uploads:[{uploadUrl,key}]}` | **wizard step 1** |
| POST | `/api/admin/comics` | see §2 STEP 2 | `Comic` (201) | **wizard step 2** |
| GET | `/api/admin/comics` | — (query filters) | `Comic[] + theme + _count` | comic list screen |
| GET | `/api/admin/comics/:comicId` | — | full tree | edit screen / resume wizard |
| PATCH | `/api/admin/comics/:comicId` | partial comic | `Comic` | edit screen |
| DELETE | `/api/admin/comics/:comicId` | — | 204 | delete comic |
| GET | `/api/admin/comics/:comicId/pricing` | — | `PricingRule[] + country` | pricing screen |
| PUT | `/api/admin/comics/:comicId/pricing` | `{pricing:[...]}` | `Comic + pricingRules` | pricing screen |
| PATCH | `/api/admin/comics/:comicId/status` | `{status}` | `Comic` | **wizard step 6** |
| **Fonts** |
| POST | `/api/admin/comics/:comicId/fonts/upload-url` | `{fileName, fileExtension}` | `{uploadUrl, key}` | **wizard step 3** |
| POST | `/api/admin/comics/:comicId/fonts` | `{name, fontKey}` | `Font` (201) | **wizard step 3** |
| GET | `/api/admin/comics/:comicId/fonts` | — | `Font[] + _count.bubbles` | font mgmt, bubble font picker |
| PATCH | `/api/admin/fonts/:fontId` | `{name?, fontKey?}` | `Font` | font mgmt |
| DELETE | `/api/admin/fonts/:fontId` | — | 204 | font mgmt |
| **Pages** |
| POST | `/api/admin/comics/:comicId/pages/upload-url` | `{fileExtension, fileType}` | `{uploadUrl, key}` | **wizard step 4** |
| POST | `/api/admin/comics/:comicId/pages` | see §2 STEP 4b | `Page` (201) | **wizard step 4** |
| GET | `/api/admin/comics/:comicId/pages` | — | `Page[] + bubbles + font` | page mgmt, bubble mapper |
| PATCH | `/api/admin/pages/:pageId` | partial page | `Page` | page edit |
| DELETE | `/api/admin/pages/:pageId` | — | 204 (cascades bubbles) | page delete |
| **Bubbles** |
| POST | `/api/admin/pages/:pageId/bubbles` | see §2 STEP 5 | `Bubble` (201) | **wizard step 5** |
| GET | `/api/admin/pages/:pageId/bubbles` | — | `Bubble[] + font` | bubble mapper |
| PATCH | `/api/admin/bubbles/:bubbleId` | partial bubble | `Bubble + font` | bubble drag/edit |
| DELETE | `/api/admin/bubbles/:bubbleId` | — | 204 | bubble delete |

### Public — no auth

| Method | Path | Returns | Used at |
|---|---|---|---|
| GET | `/api/public/comics` | published `Comic[]` | catalogue |
| GET | `/api/public/comics/:comicId` | published comic + preview pages | product detail |
| GET | `/api/public/themes` | `Theme[]` | theme filter **and admin theme dropdown** |

---

# PART 5 — PATH-SHAPE GOTCHAS

The nesting is inconsistent. **CREATE and LIST are nested under the parent; UPDATE and DELETE are top-level.** Memorize this or you'll spend an afternoon on 404s.

```
CREATE / LIST  (nested under parent)          UPDATE / DELETE  (top-level)
──────────────────────────────────────        ──────────────────────────────
POST /comics/:comicId/pages                   PATCH  /pages/:pageId
GET  /comics/:comicId/pages                   DELETE /pages/:pageId

POST /pages/:pageId/bubbles                   PATCH  /bubbles/:bubbleId
GET  /pages/:pageId/bubbles                   DELETE /bubbles/:bubbleId

POST /comics/:comicId/fonts                   PATCH  /fonts/:fontId
GET  /comics/:comicId/fonts                   DELETE /fonts/:fontId
```

Other shape traps:
- `POST /comics/thumbnails/upload-urls` — **plural** on both words. Not `/thumbnail/upload-url`.
- `fileType: "masks"` — **plural**. `"mask"` is rejected.
- Countries use **PUT** for update; everything else uses **PATCH**.
- `GET /api/public/themes` — the theme list is on the **public** router even for admin use.

---

# PART 6 — ENUM VALUE REFERENCE

Send these strings **exactly**. They are case-sensitive.

| Enum | Values |
|---|---|
| `genderTag` | `BOY`, `GIRL`, `UNISEX` |
| `ageGroup` | `AGE_0_2`, `AGE_3_5`, `AGE_6_8`, `AGE_9_12` |
| `coverType` | `HARDCOVER`, `SOFTCOVER` |
| `status` (comic) | `DRAFT`, `PUBLISHED`, `UNPUBLISHED` — (`PUBLISHING` exists in the DB but is never set) |
| `faceDirection` | `front`, `three-quarter`, `side` — ⚠️ **lowercase, hyphenated**, unlike every other enum |
| `fileType` (page upload) | `artwork`, `masks` |
| `fileExtension` (page) | `jpg`, `jpeg`, `png`, `webp` |
| `fileExtension` (font) | `ttf`, `otf`, `woff`, `woff2` |

Numeric bounds:

| Field | Min | Max | Default |
|---|---|---|---|
| `Page.steps` | 1 | 8 | 3 |
| `Page.cfg` | 1.0 | 3.0 | 1.0 |
| `Bubble.fontSize` | 1 | — | 24 |
| `thumbnailKeys` length | 1 | 10 | — |
| `pricing` length | 1 | — | — |

---

# PART 7 — DO NOT BUILD THESE

Explicitly out of scope. Building them wastes your time and creates confusion.

1. **⛔ LoRA upload UI.** `POST /api/admin/comics/lora/upload-url` exists and works, and `loraKey`/`loraStrength` are accepted on comic create/update. **They do nothing.** The AI face-swap model is a single file baked into the generation server and is identical for every comic. These fields are retained for schema stability only. **Do not put a LoRA step in the wizard. Do not surface `loraFileUrl` or `loraStrength` anywhere.**

2. **⛔ Publish progress UI.** No job, no polling, no websocket. It's a synchronous status flip. A spinner on the button is all you need.

3. **⛔ Page reordering.** `pageNumber` is immutable after create. There is no reorder endpoint.

4. **⛔ Thumbnail add/remove sub-endpoints.** They don't exist. It's full-array replacement via `PATCH /comics/:comicId` only.

5. **⛔ A single-file thumbnail upload endpoint.** Removed. Use the batch endpoint with `files: [{...}]`.

6. **⛔ Generation, photo upload, checkout, payment.** Endpoints exist in various states but are not part of this milestone.

7. **⛔ Server-side pagination or sorting controls.** Neither list endpoint supports them. Do it client-side.

---

# PART 8 — KNOWN BLOCKERS (raise these with backend now)

These are real gaps found while writing this guide, not things you're doing wrong. **Read them before estimating the work**, because two of them affect screens you're about to build.

## 8.1 🔴 BLOCKER — Preview page artwork is not displayable on the user front

`GET /api/public/comics/:comicId` returns `pages[].artworkUrl`. But page artwork is uploaded to the **private** R2 bucket, and the value stored is the raw object **key** (`comics/<id>/pages/artwork/1753689200000.png`), not a URL.

**Effect:** the "see a free preview of the pages" section of the product detail page **cannot be built** as things stand. There is no public URL and no signed-download endpoint.

**Needs from backend (pick one):** upload page artwork to the public bucket and store a public URL, **or** add a signed-download endpoint that returns temporary read URLs for preview pages.

**Until resolved:** build the detail page using `coverThumbnailUrls` only, and stub the preview-pages carousel behind a feature flag.

## 8.2 🔴 BLOCKER — Admin cannot re-display uploaded page artwork or fonts

Same root cause. `Page.artworkUrl`, `Page.maskUrl`, and `Font.fileUrl` are all private-bucket keys.

**Effect on the bubble mapper:** during the initial upload you can display the artwork from the local `File` via `URL.createObjectURL()`. But **as soon as the admin reloads the page or comes back later to edit an existing comic, there is no way to fetch that image back.** The bubble mapper cannot render its background. Same for `@font-face`-ing the uploaded font to preview dialogue in the real typeface.

**Needs from backend:** a signed-download endpoint for private assets, e.g. `GET /api/admin/assets/signed-url?key=...`.

**Until resolved:** the mapper only works within a single unbroken session immediately after upload. Flag this as a hard dependency in your estimate — the "edit an existing comic's bubbles" flow is not buildable without it.

## 8.3 🟠 Bubble coordinates have no reference resolution

There is no field storing the artwork's pixel dimensions, so the backend cannot validate or rescale the `x/y/width/height` you send. Follow the natural-pixel-space convention in §2 STEP 5 and **confirm it with backend** so Sharp's compositing matches.

## 8.4 🟠 Cross-comic font is not validated on bubble CREATE

Only the update path checks it. Never populate the font picker from anything but `GET /api/admin/comics/:comicId/fonts`.

## 8.5 🟠 `freePreviewPages` rules differ between create and update

Create allows `0` and enforces `< pageCount`. Update requires `> 0` and does **not** enforce `< pageCount`. Enforce both rules client-side on both forms.

## 8.6 🟡 Page upload keys are timestamp-only

`Date.now()`-based with no random suffix. Parallel upload-url requests can collide. Serialize them.

## 8.7 🟡 R2 orphans on replace

Replacing a country flag, a page's artwork/mask, or a font file leaves the old object in R2. Only comic *thumbnails* get cleaned up on replace/delete. Cosmetic; no action needed from you.

---

# PART 9 — SUGGESTED BUILD ORDER

1. **API layer + auth plumbing.** Response unwrapping (`.data.data`), error normalization, `credentials: "include"` everywhere. Verify with `GET /api/admin/status`.
2. **The `uploadToR2` helper** (§0.2). Everything depends on it.
3. **Countries + Themes CRUD.** Small, self-contained, and they're prerequisites. Good warm-up.
4. **Comic list screen** (`GET /api/admin/comics`) with filters and `_count` badges.
5. **Wizard steps 1–2** (thumbnails + create). This is the milestone that unlocks everything — once `comicId` exists, the rest is parallelizable.
6. **Fonts screen** (step 3).
7. **Pages screen** (step 4) — upload + create + list.
8. **Bubble mapper** (step 5). Hardest screen. **Blocked on §8.2 for the edit-existing flow** — build the fresh-upload flow first.
9. **Pricing screen** (`GET`/`PUT` pricing) — remember the string-in/number-out asymmetry.
10. **Pre-publish checklist + publish** (step 6).
11. **Public catalogue + detail.** Straightforward. **Preview-pages carousel blocked on §8.1.**

Steps 1–5 have no blockers. Start there and raise §8.1/§8.2 with backend in parallel so they're resolved by the time you reach steps 8 and 11.
