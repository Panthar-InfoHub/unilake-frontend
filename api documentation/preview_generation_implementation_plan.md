# Comic Preview Generation Flow — Complete Implementation Plan

## Goal

Build the full customer-facing personalization flow: user fills form + uploads photo → session is created → WebSocket connects → generation triggers → pages stream in live → user views preview with locked/generating/ready states → optional regeneration → pricing section at the bottom.

---

## Design Decisions (Confirmed)

| Decision | Choice |
|---|---|
| Route after form submission | New route: `/personalize/[sessionId]/preview` |
| Preview viewer layout | Full-width page viewer, form disappears entirely |
| Page display | Vertical scroll of ALL pages, with left/right arrows for navigation |
| Cover page | Show `coverThumbnailUrls[0]` as first page labelled "Cover Page" |
| Continue to Checkout button | Non-functional — shows "coming soon" toast |
| Regeneration | Included — regenerate button per preview page, variant browsing, "X tries left" |
| Session persistence | `localStorage` keyed by `comicId` — resume on return |
| Flow architecture | Two separate routes: form on `/comic/[comicId]`, preview on `/personalize/[sessionId]/preview` |

---

## High-Level Architecture

```
/comic/[comicId]                        (EXISTING — form page)
  │
  ├── User fills form + uploads photo
  ├── On "PERSONALISED" click:
  │     1. POST /sessions { comicId }        → creates session
  │     2. PATCH /sessions/:id { childName, age, pronounKey, notificationEmail }
  │     3. Photo normalize → MediaPipe check → upload-url → PUT R2 → confirm
  │     4. Save sessionId + wsRoomToken to localStorage
  │     5. router.push(`/personalize/${sessionId}/preview`)
  │
  └── On return visit: check localStorage → if session exists & valid → offer resume

/personalize/[sessionId]/preview        (NEW — preview page)
  │
  ├── On mount:
  │     1. GET /sessions/:id                 → full snapshot (truth)
  │     2. Connect WebSocket                 → live deltas
  │     3. If status is PHOTO_UPLOADED → trigger POST /generate
  │     4. If status is GENERATING_PREVIEW → render progress
  │     5. If status is PREVIEW_READY → render finished preview
  │
  ├── WebSocket events:
  │     page:ready → patch local state with image
  │     page:error → mark as retrying
  │     session:preview-ready → re-GET, update status
  │
  ├── Render ALL pages in sequence:
  │     Cover page → Page 1 → Page 2 → ... → Page N
  │     Each page = one of 3 states:
  │       • SD_READY (preview page): show generated image
  │       • Generating (preview page, no image yet): "GENERATING..." placeholder
  │       • Locked (non-preview page): blurred/opaque overlay "Purchase to see"
  │
  ├── Regeneration per preview page (max 3 variants)
  │
  └── Pricing section at bottom: SoftCover / HardCover selection + "Continue to Checkout"
```

---

## Proposed Changes — Organized by Phase

### Phase 1: Types & Session API Layer

> Foundation — all the TypeScript types and API action functions for sessions.

---

#### [NEW] `app/types/session.ts`

All session-related types from the API doc §10:

```ts
export type SessionStatus =
  | "CREATED" | "PHOTO_UPLOADED" | "GENERATING_PREVIEW" | "PREVIEW_READY"
  | "AWAITING_PAYMENT" | "PAID" | "GENERATING_PAID" | "PAID_PAGES_READY"
  | "CONFIRMED" | "COMPILING_PDF" | "DISPATCHED" | "COMPLETED" | "FAILED";

export type PageVersionStatus =
  | "QUEUED" | "TEXT_STAMPING" | "TEXT_STAMPED"
  | "GENERATING_SD" | "SD_READY" | "FAILED";

export type PronounKey = "HE" | "SHE" | "THEY";

export interface Variant { ... }
export interface SessionPage { ... }
export interface SessionSnapshot { ... }
export interface CreateSessionResponse { ... }
export interface GenerateResponse { ... }
export interface RegenerateResponse { ... }
export interface PhotoUploadUrlResponse { ... }
export interface PhotoConfirmResponse { ... }
// WebSocket event types
export interface PageReadyEvent { ... }
export interface PageErrorEvent { ... }
export interface PreviewReadyEvent { ... }
export type WSEvent = PageReadyEvent | PageErrorEvent | PreviewReadyEvent;
```

---

#### [NEW] `app/actions/session/index.ts`

API action functions for the 7 session endpoints (using the existing `api` axios instance which auto-unwraps the `{ success, data }` envelope):

| Function | Endpoint | Notes |
|---|---|---|
| `createSession(comicId)` | `POST /api/public/sessions` | Returns `{ id, wsRoomToken, ... }` |
| `updateSession(sessionId, fields)` | `PATCH /api/public/sessions/:id` | Partial update — sends `childName`, `age`, `pronounKey`, `notificationEmail` |
| `getSession(sessionId)` | `GET /api/public/sessions/:id` | Full snapshot — the source of truth |
| `getPhotoUploadUrl(sessionId, ext)` | `POST .../photo/upload-url` | Returns `{ uploadUrl, key }` |
| `confirmPhoto(sessionId, key)` | `POST .../photo/confirm` | ⚠️ Response nested under `data.session` — must unwrap manually |
| `triggerGeneration(sessionId)` | `POST .../generate` | Returns `{ status, jobsEnqueued }` |
| `regeneratePage(sessionId, pageNumber)` | `POST .../pages/:pageNumber/regenerate` | Returns `{ queued, pageNumber, variantIndex }` |

> **Critical:** `confirmPhoto` is the only endpoint that nests its response under `data.session`. Since the axios interceptor already unwraps `data`, the confirm response will be `{ session: {...} }` — we must access `.session` from the result.

---

### Phase 2: Photo Normalization & MediaPipe Validation

> The client is the **only validation gate** — the backend performs zero photo checks.

---

#### [NEW] `app/lib/photo-normalize.ts`

Photo preprocessing utility:
- Convert HEIC/HEIF → JPEG (using `heic2any` library — **new dependency**)
- Downscale so the long edge is ~1600px
- Re-encode as JPEG at 0.9 quality, target <2MB
- Always produces a Blob with `image/jpeg` content type

```ts
export async function normalizePhoto(file: File): Promise<Blob>
```

---

#### [NEW] `app/lib/photo-validate.ts`

MediaPipe face detection (**new dependency**: `@mediapipe/tasks-vision`):

```ts
export type PhotoCheck = {
  passed: boolean;
  blockReason?: "no_face" | "multiple_faces";
  warnings: string[];
};
export async function checkPhoto(blob: Blob): Promise<PhotoCheck>
```

**Hard gate:** exactly 1 face → pass. 0 or 2+ → block (do not upload).
**Advisory warnings:** face too small (<15%), face off-centre (>25%), possible sunglasses.

The `.wasm` bundle and `.tflite` model will be self-hosted under `/public/mediapipe/`.

---

### Phase 3: WebSocket Manager

> A lightweight reconnecting WebSocket wrapper, not a library.

---

#### [NEW] `app/lib/websocket.ts`

A small class/function that:
- Connects to `ws://localhost:8080/?sessionId=X&token=Y` (derived from API base URL)
- Derives `ws://` vs `wss://` from the API URL automatically
- Parses incoming JSON messages and emits typed events
- Reconnects with exponential backoff (1s → 2s → 4s → ... cap at 30s)
- **On every reconnect → triggers a `GET /sessions/:id` refetch** (events during disconnect are lost forever)
- Stops reconnecting when session reaches `PREVIEW_READY` and no regeneration is in progress
- Exposes `close()` for cleanup on unmount

---

### Phase 4: Session State Hook

> The central state management hook that ties REST + WebSocket together.

---

#### [NEW] `hooks/useSessionPreview.ts`

A custom hook that manages the entire preview lifecycle:

```ts
export function useSessionPreview(sessionId: string) {
  // Returns:
  return {
    snapshot,           // SessionSnapshot | null
    isLoading,          // boolean
    error,              // string | null
    status,             // SessionStatus
    jobsEnqueued,       // number (from generate response)
    pagesReady,         // number (count of SD_READY variants)
    triggerGeneration,  // () => Promise<void>
    regeneratePage,     // (pageNumber: number) => Promise<void>
  };
}
```

**Internally:**
1. On mount → `GET /sessions/:id` via TanStack Query (`queryKey: ["session", sessionId]`)
2. Opens WebSocket using the `wsRoomToken` from the snapshot
3. On `page:ready` → optimistically patches the query cache (adds/updates variant)
4. On `page:error` → marks variant as "FAILED" in cache (but NOT permanent — retries happen)
5. On `session:preview-ready` → invalidates query → re-GETs → status becomes PREVIEW_READY
6. On tab focus → refetches via `GET` (the two-channel rule from §2.1)
7. On WebSocket reconnect → refetches via `GET`

---

### Phase 5: Modify Existing Comic Detail Page (`/comic/[comicId]`)

> Wire the form to actually create sessions, upload photos, and navigate to preview.

---

#### [MODIFY] [ComicPersonalizeForm.tsx](file:///d:/Codes/Panthar/unilake-code/frontend/components/comic/ComicPersonalizeForm.tsx)

The form becomes **functional** — clicking "PERSONALISED" now:

1. **Client-side validation:**
   - All fields required: `name`, `gender`, `age`, `birthMonth`, `email`, `consent` checkbox, and a photo
   - Show validation errors inline if any field is missing

2. **Gender → pronounKey mapping:**
   - `Boy` → `"HE"`
   - `Girl` → `"SHE"`

3. **On submit (sequential, with loading state):**
   ```
   a) POST /sessions { comicId }                          → get sessionId + wsRoomToken
   b) PATCH /sessions/:id { childName, age, pronounKey, notificationEmail }
   c) Photo: normalize → MediaPipe check → upload-url → PUT R2 → confirm
   d) Save { sessionId, wsRoomToken, comicId } to localStorage
   e) router.push(`/personalize/${sessionId}/preview`)
   ```

4. **Show step-by-step progress** during submission:
   - "Creating your session..."
   - "Saving details..."
   - "Validating photo..."
   - "Uploading photo..."
   - "Preparing preview..."

5. **Error handling:**
   - MediaPipe blocks (0 faces / multiple faces) → show error, let user re-pick
   - MediaPipe warnings → show warning dialog with "Use anyway" / "Choose different" options
   - API errors → toast with friendly message
   - Upload errors → retry prompt

6. **Photo dropzone becomes functional:**
   - Uses `react-dropzone` (already in package.json)
   - Shows local preview via `URL.createObjectURL()`
   - Accepts `image/jpeg, image/png, image/webp, image/heic, image/heif`

---

#### [MODIFY] [ComicDetailContent.tsx](file:///d:/Codes/Panthar/unilake-code/frontend/components/comic/ComicDetailContent.tsx)

Minor update — pass `comicId` down so the form can create sessions.

---

#### [MODIFY] [page.tsx](file:///d:/Codes/Panthar/unilake-code/frontend/app/comic/%5BcomicId%5D/page.tsx)

- On mount, check `localStorage` for existing session for this `comicId`
- If found → call `GET /sessions/:id` → if valid (not expired, status > CREATED) → show "Continue where you left off" banner with a button to resume → navigates to `/personalize/[sessionId]/preview`
- If expired → clear localStorage, show fresh form

---

### Phase 6: Preview Page (The Big One)

> The new `/personalize/[sessionId]/preview` route and all its components.

---

#### [NEW] `app/personalize/[sessionId]/preview/page.tsx`

The page component:
- Extracts `sessionId` from route params
- Uses `useSessionPreview(sessionId)` hook
- On mount: if session status is `PHOTO_UPLOADED` → triggers generation automatically
- Wraps with `HomeHeaderSection` + `Footer`
- Renders:
  - If loading → skeleton
  - If error / not found / expired → error state with "Start again" button
  - Otherwise → `<PreviewViewer snapshot={snapshot} ... />`

---

#### [NEW] `components/preview/PreviewViewer.tsx`

The main preview layout component:

```
┌────────────────────────────────────────────────┐
│  Progress bar: "3 of 5 pages ready"            │
│  (only visible while GENERATING_PREVIEW)       │
├────────────────────────────────────────────────┤
│                                                │
│  ◀  [ Cover Page image ]  ▶                    │
│     "Cover Page" label                         │
│                                                │
│  ◀  [ Page 1 — generated image ]  ▶           │
│     Regenerate button + variant strip          │
│                                                │
│  ◀  [ Page 2 — "GENERATING..." ]  ▶           │
│     "UniLake stands for an Universal           │
│      Lake of Ideas"                            │
│                                                │
│  ◀  [ Page 3 — LOCKED: blurred overlay ]  ▶   │
│     "Purchase the comic to see all pages"      │
│                                                │
│  ... (all pages in sequence) ...               │
│                                                │
├────────────────────────────────────────────────┤
│  Pricing Section:                              │
│  ┌──────────┐  Choose Cover  ┌──────────┐     │
│  │ SoftCover │   Format      │ HardCover │     │
│  │  ₹1,199  │               │  ₹1,499  │     │
│  └──────────┘               └──────────┘     │
│  [ CONTINUE TO CHECKOUT ] (non-functional)    │
└────────────────────────────────────────────────┘
```

**Props:** `snapshot: SessionSnapshot`, event handlers for generation/regeneration.

---

#### [NEW] `components/preview/PreviewPageCard.tsx`

Renders a single page in one of **three states**:

| State | Condition | Render |
|---|---|---|
| **Ready** | `isPreviewPage && variant.status === "SD_READY"` | Generated image (`finalImageUrl`) with optional regenerate controls |
| **Generating** | `isPreviewPage && no SD_READY variant` | White card with bold "GENERATING..." text + "UniLake stands for an Universal Lake of Ideas" subtitle |
| **Locked** | `!isPreviewPage` | Blurred/opaque overlay with lock icon + "Purchase the comic to see all pages" message |

- Uses `artworkWidth`/`artworkHeight` from the comic detail to set aspect-ratio boxes and prevent layout shift
- Left/right navigation arrows (yellow circles matching existing design system)
- Shows page number label below each page

---

#### [NEW] `components/preview/GeneratingPlaceholder.tsx`

The "GENERATING..." card shown for pages still being processed:
- Bold black text "GENERATING..."
- Subtitle: "UniLake stands for an Universal Lake of Ideas"
- Clean white background with subtle border
- Matches the design screenshot exactly

---

#### [NEW] `components/preview/LockedPageOverlay.tsx`

The locked page overlay for non-preview pages:
- Semi-transparent/blurred overlay over a placeholder background
- Lock icon + "Purchase the comic to see all pages" text
- Styled consistently with the rest of the preview viewer

---

#### [NEW] `components/preview/RegenerateControls.tsx`

Shown below each preview page that has an `SD_READY` variant:
- "Regenerate" button (disabled when max variants reached)
- Shows "X tries left" text (calculated as `3 - page.variants.length`)
- When regenerating → shows loading spinner on that page
- Variant thumbnail strip: small thumbnails of all `SD_READY` variants, click to switch displayed image

---

#### [NEW] `components/preview/PreviewProgress.tsx`

Progress bar shown during `GENERATING_PREVIEW` status:
- "X of Y pages ready" text
- Visual progress bar (animated fill)
- Y comes from `jobsEnqueued` (stored from generate response)
- X comes from counting `SD_READY` variants across preview pages

---

#### [NEW] `components/preview/PricingSection.tsx`

The pricing section at the bottom of the preview:
- "Complete Your Order To Unlock The Full Story" heading
- "Choose Cover Format" subtitle
- Two cards side by side: SoftCover (with price) and HardCover (with price)
- Prices come from `snapshot.comic.pricingRules` filtered to the user's selected country (from `useCountryStore`)
- Selected card has purple border highlight
- "CONTINUE TO CHECKOUT" button — styled matching the design, non-functional (shows toast)

---

### Phase 7: Session Persistence & Resume Flow

---

#### [NEW] `app/lib/session-storage.ts`

Simple localStorage wrapper:

```ts
interface StoredSession {
  sessionId: string;
  wsRoomToken: string;
  comicId: string;
  createdAt: string; // ISO timestamp for manual expiry check
}

export function saveSession(comicId: string, data: StoredSession): void
export function getSession(comicId: string): StoredSession | null
export function clearSession(comicId: string): void
```

- Keyed by `comicId` so each comic has its own session
- 24-hour TTL check on read (matches backend expiry)

---

## New Dependencies

| Package | Purpose | Why |
|---|---|---|
| `@mediapipe/tasks-vision` | Client-side face detection (the only validation gate) | Backend performs zero photo validation |
| `heic2any` | HEIC → JPEG conversion for iPhone photos | iPhones shoot HEIC by default; upload accepts jpg/jpeg/png/webp only |

---

## Static Assets Needed

| Asset | Location | Purpose |
|---|---|---|
| `blaze_face_short_range.tflite` | `/public/mediapipe/` | MediaPipe face detection model |
| MediaPipe WASM files | `/public/mediapipe/wasm/` | MediaPipe runtime |

These are downloaded from the `@mediapipe/tasks-vision` package and copied to `/public/` so they're self-hosted (no CDN dependency).

---

## Files Summary

| Phase | Action | File | Purpose |
|---|---|---|---|
| 1 | NEW | `app/types/session.ts` | Session types (snapshot, events, statuses) |
| 1 | NEW | `app/actions/session/index.ts` | 7 session API action functions |
| 2 | NEW | `app/lib/photo-normalize.ts` | HEIC→JPEG, downscale, re-encode |
| 2 | NEW | `app/lib/photo-validate.ts` | MediaPipe face detection gate |
| 3 | NEW | `app/lib/websocket.ts` | Reconnecting WebSocket manager |
| 4 | NEW | `hooks/useSessionPreview.ts` | Central session state hook (REST + WS) |
| 5 | MODIFY | `components/comic/ComicPersonalizeForm.tsx` | Wire form to create session, upload photo, navigate |
| 5 | MODIFY | `components/comic/ComicDetailContent.tsx` | Pass comicId to form |
| 5 | MODIFY | `app/comic/[comicId]/page.tsx` | Session resume check on mount |
| 6 | NEW | `app/personalize/[sessionId]/preview/page.tsx` | Preview route page component |
| 6 | NEW | `components/preview/PreviewViewer.tsx` | Main preview layout |
| 6 | NEW | `components/preview/PreviewPageCard.tsx` | Single page renderer (3 states) |
| 6 | NEW | `components/preview/GeneratingPlaceholder.tsx` | "GENERATING..." card |
| 6 | NEW | `components/preview/LockedPageOverlay.tsx` | Blurred locked page overlay |
| 6 | NEW | `components/preview/RegenerateControls.tsx` | Regenerate button + variant strip |
| 6 | NEW | `components/preview/PreviewProgress.tsx` | Progress bar during generation |
| 6 | NEW | `components/preview/PricingSection.tsx` | Cover type selection + checkout CTA |
| 7 | NEW | `app/lib/session-storage.ts` | localStorage wrapper for session persistence |

**Total: 14 new files, 3 modified files**

---

## ⚠️ Critical Implementation Notes

### From the API doc — things that will break if ignored:

1. **`photo/confirm` nests under `data.session`** — our axios interceptor already strips the outer `data`, so the confirm response will be `{ session: {...} }`. Must access `.session`.

2. **Content-Type on R2 PUT must be `image/jpeg`** — NOT `image/jpg`. The existing `uploadToR2` utility accepts a `contentType` param — always pass `"image/jpeg"` since we always re-encode to JPEG.

3. **Connect WebSocket BEFORE calling `/generate`** — non-face pages finish in 1-2 seconds. Socket opened after will miss events.

4. **`page:error` is NOT final** — backend retries up to 3x. Show "retrying" state, not dead end.

5. **`freePreviewPages` is unreliable** — always use `pages.filter(p => p.isPreviewPage).length` for the count.

6. **`bestPhotoUrl` is NOT renderable** — it's a private R2 key. Must keep photo preview client-side via `URL.createObjectURL()`.

7. **Always re-GET on WebSocket reconnect and tab focus** — events are never replayed.

8. **The variant cap is 3 total** (original + 2 regenerations). Show remaining tries and disable button at zero.

---

## Verification Plan

### Manual Verification

1. **Form submission flow:**
   - Fill all fields → upload photo → click PERSONALISED
   - Verify session is created, details are patched, photo is uploaded + confirmed
   - Verify redirect to `/personalize/[sessionId]/preview`

2. **MediaPipe validation:**
   - Test with photo containing 0 faces → should block
   - Test with photo containing 2+ faces → should block
   - Test with small/off-centre face → should warn but allow
   - Test with HEIC from iPhone → should convert and work

3. **Preview viewer:**
   - Cover page appears first
   - Preview pages show "GENERATING..." while processing
   - Non-preview pages show locked/blurred overlay
   - Pages appear one by one as WebSocket events arrive
   - Progress bar updates as pages complete

4. **Regeneration:**
   - Click regenerate on a ready page → new variant arrives
   - Variant strip shows all variants, click to switch
   - After 2 regenerations → button disabled, shows "0 tries left"

5. **Session resume:**
   - Start a session → close tab → come back → "Continue where you left off" banner appears
   - Click resume → navigates to preview with correct state

6. **Edge cases:**
   - Expired session → clear state, show "start again"
   - `jobsEnqueued: 0` → show error
   - WebSocket disconnect → reconnect + re-GET
   - Tab backgrounded during generation → re-GET on focus

### Build Order

| # | Phase | Task | Dependencies |
|---|---|---|---|
| 1 | 1 | Session types (`app/types/session.ts`) | None |
| 2 | 1 | Session API actions (`app/actions/session/index.ts`) | Types |
| 3 | 7 | Session localStorage helper (`app/lib/session-storage.ts`) | Types |
| 4 | 2 | Install `heic2any` + `@mediapipe/tasks-vision` | None |
| 5 | 2 | Photo normalize utility | `heic2any` |
| 6 | 2 | Photo validate utility + copy MediaPipe model files | `@mediapipe/tasks-vision` |
| 7 | 3 | WebSocket manager | Types |
| 8 | 4 | `useSessionPreview` hook | Actions, WebSocket, Types |
| 9 | 6 | `GeneratingPlaceholder` component | None |
| 10 | 6 | `LockedPageOverlay` component | None |
| 11 | 6 | `RegenerateControls` component | Hook |
| 12 | 6 | `PreviewProgress` component | None |
| 13 | 6 | `PreviewPageCard` component | Steps 9, 10, 11 |
| 14 | 6 | `PricingSection` component | Country store |
| 15 | 6 | `PreviewViewer` component | Steps 12, 13, 14 |
| 16 | 6 | Preview page route (`app/personalize/[sessionId]/preview/page.tsx`) | Steps 8, 15 |
| 17 | 5 | Wire `ComicPersonalizeForm` — make form functional | Steps 2, 3, 5, 6 |
| 18 | 5 | Update `ComicDetailContent` + `page.tsx` — resume flow | Step 3 |
| 19 | — | End-to-end testing + polish | All |
