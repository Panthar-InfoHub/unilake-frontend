# Comic Upload Wizard — Complete Execution Plan

> **Scope:** Phases 0–8. Everything needed to create, manage, and publish comics from the admin panel.
>
> **Rule:** Existing components are NOT modified in functionality. All new work lives in new files.

---

## Open Decision: Bubble Mapper Routing

> [!IMPORTANT]
> **Should the bubble mapper be a separate page or inline within the Pages tab?**
>
> **Option A (Recommended): Separate page at `/admin/comics/[comicId]/pages/[pageId]/bubbles`**
> - Deep-linkable — admin can bookmark or share a link to a specific page's bubble mapping
> - The mapper is the most complex screen; giving it a full page avoids cramming it inside a tab
> - Browser back button naturally returns to the Pages tab
> - Consistent with the doc's recommended URL structure (§1.4)
>
> **Option B: Inline within the Pages tab**
> - Clicking a page thumbnail expands the mapper below or as a fullscreen overlay
> - No additional routing, but the URL doesn't change so it's not resumable
> - Risk of the tab getting very heavy (page list + full canvas mapper)
>
> The rest of this plan assumes **Option A**. If you choose Option B, the only change is that `BubbleMapperPage` becomes a component rendered inside the Pages tab instead of its own `page.tsx`.

---

## File Map — Every file created or modified

### New Dependencies (3)

| Package | Purpose |
|---|---|
| `react-hook-form` | Form state management for comic create/edit |
| `zod` + `@hookform/resolvers` | Schema validation matching backend rules |
| `konva` + `react-konva` + `use-image` | Canvas-based bubble mapper with zoom/pan/resize |

### New Type Definitions (1 file)

| # | File | Contents |
|---|---|---|
| 1 | `app/types/comic.ts` | `Comic`, `ComicListItem`, `Page`, `Bubble`, `Font`, `PricingRule`, `ThumbnailUploadResponse`, all enums (`GenderTag`, `AgeGroup`, `CoverType`, `ComicStatus`, `FaceDirection`, `FontExtension`, `PageFileType`, `PageFileExtension`) |

### New API Actions (4 files)

| # | File | Endpoints covered |
|---|---|---|
| 2 | `app/actions/comic/index.ts` | `fetchComics`, `fetchComic`, `createComic`, `updateComic`, `deleteComic`, `updateComicStatus`, `getThumbnailUploadUrls`, `setThumbnails`, `fetchPricing`, `updatePricing` |
| 3 | `app/actions/font/index.ts` | `fetchFonts`, `requestFontUploadUrl`, `createFont`, `updateFont`, `deleteFont` |
| 4 | `app/actions/page/index.ts` | `fetchPages`, `requestPageUploadUrl`, `createPage`, `updatePage`, `deletePage` |
| 5 | `app/actions/bubble/index.ts` | `fetchBubbles`, `createBubble`, `updateBubble`, `deleteBubble` |

### New TanStack Query Hooks (4 files)

| # | File | Hooks |
|---|---|---|
| 6 | `hooks/useComics.ts` | `useComics`, `useComic`, `useCreateComic`, `useUpdateComic`, `useDeleteComic`, `useUpdateComicStatus`, `useSetThumbnails` |
| 7 | `hooks/useFonts.ts` | `useFonts`, `useCreateFont`, `useUpdateFont`, `useDeleteFont` |
| 8 | `hooks/usePages.ts` | `usePages`, `useCreatePage`, `useUpdatePage`, `useDeletePage` |
| 9 | `hooks/useBubbles.ts` | `useBubbles`, `useCreateBubble`, `useUpdateBubble`, `useDeleteBubble` |
| 10 | `hooks/usePricing.ts` | `usePricing`, `useUpdatePricing` |

### New Pages (3 files)

| # | File | Purpose |
|---|---|---|
| 11 | `app/admin/(panel)/comics/page.tsx` | **REPLACE** — Comic list with filters, pagination, three-dot menu |
| 12 | `app/admin/(panel)/comics/new/page.tsx` | Comic create wizard (steps 1–2) |
| 13 | `app/admin/(panel)/comics/[comicId]/page.tsx` | Comic detail hub with tab bar |
| 14 | `app/admin/(panel)/comics/[comicId]/pages/[pageId]/bubbles/page.tsx` | Bubble mapper (if Option A chosen) |

### New Components (organized by feature)

**Comic List** (`components/admin/comic/`)

| # | File | Purpose |
|---|---|---|
| 15 | `ComicListPageHeader.tsx` | Title + "Add Comic" button + filter controls |
| 16 | `ComicListFilters.tsx` | Gender, age group, theme, search filters bar |
| 17 | `ComicListTable.tsx` | Table with status chips, `_count` badges, thumbnail preview |
| 18 | `ComicRowActions.tsx` | Three-dot dropdown menu per row |
| 19 | `ComicDeleteDialog.tsx` | Type-the-title-to-confirm delete dialog |
| 20 | `ComicStatusBadge.tsx` | Colored status chip (DRAFT/PUBLISHED/UNPUBLISHED) |
| 21 | `ComicPagination.tsx` | Previous/Next page controls (10 per page) |

**Comic Create** (`components/admin/comic/create/`)

| # | File | Purpose |
|---|---|---|
| 22 | `CreateComicForm.tsx` | react-hook-form wrapper: details + thumbnails + pricing |
| 23 | `ComicDetailsFields.tsx` | Title, genderTag, pageCount, freePreviewPages, ageGroup, themeId, description, isBestseller |
| 24 | `ThumbnailUploader.tsx` | Multi-file drop zone (1–10), R2 batch upload, drag-to-reorder previews |
| 25 | `PricingGrid.tsx` | All countries × HARDCOVER/SOFTCOVER grid, price inputs |
| 26 | `comicCreateSchema.ts` | Zod schema for the create form |

**Comic Detail Hub** (`components/admin/comic/detail/`)

| # | File | Purpose |
|---|---|---|
| 27 | `ComicDetailHub.tsx` | Main hub layout: summary card + tab bar + tab content |
| 28 | `ComicSummaryCard.tsx` | Read-only summary (title, status, theme, page progress, thumbnail count) |
| 29 | `ComicInfoEditor.tsx` | Inline-editable comic fields (title, gender, age, description, etc.) |
| 30 | `ThumbnailManager.tsx` | Add/delete/reorder/set-primary thumbnails panel |
| 31 | `ComicTabBar.tsx` | Tab navigation: Fonts | Pages | Pricing | Review |

**Font Management** (`components/admin/comic/fonts/`)

| # | File | Purpose |
|---|---|---|
| 32 | `FontList.tsx` | Table of fonts with `_count.bubbles`, add/edit/delete |
| 33 | `FontUploadModal.tsx` | Upload font file (sequential only), set display name |
| 34 | `FontEditModal.tsx` | Edit name, optionally replace file |
| 35 | `FontDeleteDialog.tsx` | Delete confirmation (blocked by 409 if bubbles reference it) |

**Page Management** (`components/admin/comic/pages/`)

| # | File | Purpose |
|---|---|---|
| 36 | `PageList.tsx` | Card grid of pages sorted by pageNumber, artwork thumbnails |
| 37 | `PageCreateModal.tsx` | Create page: pageNumber, artwork upload, mask upload, hasFace/mirrorFace/faceDirection, isPreviewPage, prompt, steps/cfg |
| 38 | `PageEditModal.tsx` | Edit page fields, replace artwork/mask |
| 39 | `PageDeleteDialog.tsx` | Delete confirmation showing bubble count |
| 40 | `PageCard.tsx` | Individual page card with artwork thumbnail + status indicators |

**Bubble Mapper** (`components/admin/comic/bubbles/`)

| # | File | Purpose |
|---|---|---|
| 41 | `BubbleMapperCanvas.tsx` | react-konva Stage with artwork, Rects, Transformer, zoom/pan |
| 42 | `BubblePanel.tsx` | Side panel: bubble list, dialogue editor, font picker, fontSize |
| 43 | `BubbleDialogueEditor.tsx` | Textarea with token insertion toolbar ({name}, {pronoun_*}) |
| 44 | `BubbleToolbar.tsx` | Add bubble, zoom controls, delete selected |
| 45 | `bubbleCoordinates.ts` | `toApi()` and `fromApi()` conversion functions (pixels ↔ fractions) |

**Pricing Editor** (`components/admin/comic/pricing/`)

| # | File | Purpose |
|---|---|---|
| 46 | `PricingEditor.tsx` | Full country × coverType grid for editing existing pricing |

**Pre-Publish** (`components/admin/comic/review/`)

| # | File | Purpose |
|---|---|---|
| 47 | `PrePublishChecklist.tsx` | 10-item checklist with pass/fail indicators |
| 48 | `PublishButton.tsx` | Publish/Unpublish button with status-aware label |

**Total: ~48 new files, 1 replaced file (`comics/page.tsx`), 0 existing files modified.**

---

# PHASE 0 — FOUNDATION

**Goal:** All types, API actions, and hooks ready before any UI.

---

## Step 0.1 — Install dependencies

```bash
npm install react-hook-form zod @hookform/resolvers konva react-konva use-image
```

---

## Step 0.2 — Create `app/types/comic.ts`

All type definitions and enums for the entire comic system. This is the single source of truth.

### Enums

```ts
export enum GenderTag { BOY = "BOY", GIRL = "GIRL", UNISEX = "UNISEX" }
export enum AgeGroup { AGE_0_2 = "AGE_0_2", AGE_3_5 = "AGE_3_5", AGE_6_8 = "AGE_6_8", AGE_9_12 = "AGE_9_12" }
export enum CoverType { HARDCOVER = "HARDCOVER", SOFTCOVER = "SOFTCOVER" }
export enum ComicStatus { DRAFT = "DRAFT", PUBLISHED = "PUBLISHED", UNPUBLISHED = "UNPUBLISHED", PUBLISHING = "PUBLISHING" }
export enum FaceDirection { FRONT = "front", THREE_QUARTER = "three-quarter", SIDE = "side" }
export enum FontExtension { TTF = "ttf", OTF = "otf", WOFF = "woff", WOFF2 = "woff2" }
export enum PageFileType { ARTWORK = "artwork", MASKS = "masks" }
export enum PageFileExtension { JPG = "jpg", JPEG = "jpeg", PNG = "png", WEBP = "webp" }
```

### Interfaces

```ts
export interface Comic {
  id: string;
  title: string;
  genderTag: GenderTag;
  pageCount: number;
  freePreviewPages: number;
  coverThumbnailUrls: string[];
  loraFileUrl: string | null;
  loraStrength: number;
  status: ComicStatus;
  publishJobId: string | null;
  publishError: string | null;
  isBestseller: boolean;
  description: string | null;
  themeId: string | null;
  ageGroup: AgeGroup | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComicListItem extends Comic {
  theme: { id: string; name: string } | null;
  _count: { pages: number; orderSessions: number; pricingRules: number };
}

export interface ComicDetail extends Comic {
  theme: { id: string; name: string } | null;
  pages: PageWithBubbles[];
  fonts: Font[];
  pricingRules: PricingRuleWithCountry[];
  _count: { orderSessions: number };
}

export interface Font {
  id: string;
  comicId: string;
  name: string;
  fileUrl: string;       // private key, NOT a usable URL
  createdAt: string;
}

export interface FontWithCount extends Font {
  _count: { bubbles: number };
}

export interface Page {
  id: string;
  comicId: string;
  pageNumber: number;
  artworkUrl: string | null;
  maskUrl: string | null;
  artworkWidth: number | null;
  artworkHeight: number | null;
  hasFace: boolean;
  mirrorFace: boolean;
  faceDirection: string | null;
  isPreviewPage: boolean;
  pagePrompt: string | null;
  steps: number;
  cfg: number;
  createdAt: string;
  updatedAt: string;
  warnings: string[];
}

export interface PageWithBubbles extends Page {
  bubbles: Bubble[];
}

export interface PageWithBubblesAndFont extends Page {
  bubbles: BubbleWithFont[];
}

export interface Bubble {
  id: string;
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dialogue: string;
  fontId: string | null;
  fontSize: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BubbleWithFont extends Bubble {
  font: { id: string; name: string } | null;
}

export interface PricingRule {
  id: string;
  comicId: string;
  countryId: string;
  coverType: CoverType;
  price: string;         // ⚠️ comes as STRING from API
  createdAt: string;
  updatedAt: string;
}

export interface PricingRuleWithCountry extends PricingRule {
  country: {
    id: string;
    name: string;
    code: string;
    currencyCode: string;
    flagUrl: string;
  };
}

// Upload response types
export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

export interface ThumbnailUploadResponse {
  uploads: UploadUrlResponse[];
}

// Create comic payload
export interface CreateComicPayload {
  title: string;
  genderTag: GenderTag;
  pageCount: number;
  freePreviewPages: number;
  thumbnailKeys: string[];
  pricing: { countryId: string; coverType: CoverType; price: number }[];
  description?: string;
  themeId?: string;
  ageGroup?: AgeGroup;
  isBestseller?: boolean;
}
```

---

## Step 0.3 — Create `app/actions/comic/index.ts`

Every comic-related API call. Key details:

| Function | Method | Path | Gotchas |
|---|---|---|---|
| `fetchComics(filters?)` | GET | `/api/admin/comics` | Strip empty query params (§9.6). `?themeId=` → 400 |
| `fetchComic(id)` | GET | `/api/admin/comics/:id` | Returns full tree (pages+bubbles+fonts+pricing) |
| `createComic(data)` | POST | `/api/admin/comics` | Body includes `thumbnailKeys` and `pricing` array |
| `updateComic(id, data)` | PATCH | `/api/admin/comics/:id` | Partial. `thumbnailKeys` is full-replacement (§4.1.1) |
| `deleteComic(id)` | DELETE | `/api/admin/comics/:id` | 409 if PUBLISHED or has active orders |
| `updateComicStatus(id, status)` | PATCH | `/api/admin/comics/:id/status` | Only checks thumbnails + pricing on publish |
| `getThumbnailUploadUrls(files)` | POST | `/api/admin/comics/thumbnails/upload-urls` | Plural on both words. Response nests under `.uploads` |
| `setThumbnails(id, desired)` | — | (calls `updateComic`) | Helper: enforces min 1, max 10. Accepts URLs + keys mixed |
| `fetchPricing(id)` | GET | `/api/admin/comics/:id/pricing` | `price` comes back as STRING |
| `updatePricing(id, rules)` | PUT | `/api/admin/comics/:id/pricing` | Full replacement. `price` must be sent as NUMBER |

**Critical `setThumbnails` helper** (§4.1.1):
```ts
export async function setThumbnails(comicId: string, desired: string[]) {
  if (desired.length === 0) throw new Error("A comic must keep at least one thumbnail");
  if (desired.length > 10) throw new Error("Maximum 10 thumbnails per comic");
  return updateComic(comicId, { thumbnailKeys: desired });
}
```

---

## Step 0.4 — Create `app/actions/font/index.ts`

| Function | Method | Path | Gotchas |
|---|---|---|---|
| `fetchFonts(comicId)` | GET | `/api/admin/comics/:comicId/fonts` | Returns `_count.bubbles` |
| `requestFontUploadUrl(comicId, data)` | POST | `/api/admin/comics/:comicId/fonts/upload-url` | 10-min expiry. Key uses `Date.now()` — no randomness |
| `createFont(comicId, data)` | POST | `/api/admin/comics/:comicId/fonts` | `fontKey` from upload-url |
| `updateFont(fontId, data)` | PATCH | `/api/admin/fonts/:fontId` | ⚠️ Top-level path, NOT nested under comic |
| `deleteFont(fontId)` | DELETE | `/api/admin/fonts/:fontId` | ⚠️ Top-level path. 409 if bubbles reference it |

**Content-Type mapping for font PUT:**
```ts
const FONT_CONTENT_TYPES: Record<FontExtension, string> = {
  ttf: "font/ttf", otf: "font/otf", woff: "font/woff", woff2: "font/woff2"
};
```

---

## Step 0.5 — Create `app/actions/page/index.ts`

| Function | Method | Path | Gotchas |
|---|---|---|---|
| `fetchPages(comicId)` | GET | `/api/admin/comics/:comicId/pages` | Returns pages with nested bubbles + font |
| `requestPageUploadUrl(comicId, data)` | POST | `/api/admin/comics/:comicId/pages/upload-url` | `fileType: "masks"` — PLURAL |
| `createPage(comicId, data)` | POST | `/api/admin/comics/:comicId/pages` | Fields say `Url` but send the KEY |
| `updatePage(pageId, data)` | PATCH | `/api/admin/pages/:pageId` | ⚠️ Top-level. When replacing artwork on a page that has a mask, send BOTH keys |
| `deletePage(pageId)` | DELETE | `/api/admin/pages/:pageId` | Cascade-deletes all bubbles. No 409 guard |

**Content-Type mapping for page PUT:**
```ts
const PAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp"
};
```

---

## Step 0.6 — Create `app/actions/bubble/index.ts`

| Function | Method | Path | Gotchas |
|---|---|---|---|
| `fetchBubbles(pageId)` | GET | `/api/admin/pages/:pageId/bubbles` | Usually unnecessary — pages endpoint nests bubbles |
| `createBubble(pageId, data)` | POST | `/api/admin/pages/:pageId/bubbles` | `fontId: null` → 400 on create. OMIT the key entirely |
| `updateBubble(bubbleId, data)` | PATCH | `/api/admin/bubbles/:bubbleId` | ⚠️ Top-level. Bounds re-checked against merged result. `fontId: null` IS accepted on update |
| `deleteBubble(bubbleId)` | DELETE | `/api/admin/bubbles/:bubbleId` | No guards |

---

## Step 0.7 — Create TanStack Query hooks

5 hook files following the existing `useCountries.ts` pattern. Key invalidation map:

| After mutation | Invalidate |
|---|---|
| Create / update / delete comic | `["comics"]`, `["comic", id]` |
| Update comic (incl. thumbnails) | `["comics"]`, `["comic", id]` |
| Update pricing | `["comic", id]`, `["comic", id, "pricing"]`, `["comics"]` |
| Publish / unpublish | `["comics"]`, `["comic", id]` |
| Create / update / delete page | `["comic", id, "pages"]`, `["comic", id]`, `["comics"]` |
| Create / update / delete bubble | `["comic", id, "pages"]` |
| Create / update / delete font | `["comic", id, "fonts"]`, `["comic", id, "pages"]` (if bubble font changed) |
| Delete comic | `["comics"]`, remove `["comic", id]` |

**`hooks/usePricing.ts`** — separate from `useComics.ts` because pricing has its own GET/PUT endpoints and the price string→number normalization belongs here.

---

# PHASE 1 — COMIC LIST PAGE

**Goal:** Replace the placeholder `comics/page.tsx` with a real list.

---

## Step 1.1 — `ComicStatusBadge.tsx`

Small utility component. Color-coded pill:
- `DRAFT` → amber/yellow
- `PUBLISHED` → green
- `UNPUBLISHED` → gray
- `PUBLISHING` → blue (defensive — never set, but handle it)

---

## Step 1.2 — `ComicListFilters.tsx`

A horizontal bar with:
- **Search** — text input, debounced 300ms, drives `search` query param
- **Gender** — select dropdown (All / BOY / GIRL / UNISEX)
- **Age Group** — select dropdown (All / AGE_0_2 / AGE_3_5 / AGE_6_8 / AGE_9_12)
- **Theme** — select dropdown populated from `useThemes()` (already built)
- **Clear Filters** button

All filters are local state. Pass them to `useComics(filters)` which calls `fetchComics` with query params. Empty values are STRIPPED before building the query string (§9.6).

---

## Step 1.3 — `ComicPagination.tsx`

Client-side pagination:
- Takes `totalItems`, `currentPage`, `pageSize` (fixed at 10)
- Renders "Showing 1–10 of 47" + Previous / Next buttons
- Emits `onPageChange(page)`

---

## Step 1.4 — `ComicRowActions.tsx`

Three-dot (`⋮`) dropdown menu using a custom popup (or Radix `DropdownMenu` if available). Actions:

| Action | When visible | What it does |
|---|---|---|
| **View / Edit** | Always | Navigate to `/admin/comics/:id` |
| **Publish** | status is `DRAFT` or `UNPUBLISHED` | Calls `updateComicStatus(id, "PUBLISHED")` |
| **Unpublish** | status is `PUBLISHED` | Calls `updateComicStatus(id, "UNPUBLISHED")` |
| **Revert to Draft** | status is `UNPUBLISHED` | Calls `updateComicStatus(id, "DRAFT")` |
| **Delete** | status is NOT `PUBLISHED` | Opens `ComicDeleteDialog`. Disabled if `_count.orderSessions > 0` |

---

## Step 1.5 — `ComicDeleteDialog.tsx`

**Type-the-title-to-confirm** dialog:
- Shows comic title, thumbnail, page count, bubble count
- Text input: "Type the comic title to confirm"
- Delete button disabled until input exactly matches `comic.title`
- Handles 409 errors: PUBLISHED → "Unpublish it first", active orders → shows count
- On success: invalidates `["comics"]`, removes `["comic", id]`, toast

---

## Step 1.6 — `ComicListTable.tsx`

Table columns:

| # | Column | Source | Notes |
|---|---|---|---|
| 1 | Cover | `coverThumbnailUrls[0]` | Small 48×64 thumbnail |
| 2 | Title | `title` | Bold, clickable → navigates to detail |
| 3 | Status | `status` | `ComicStatusBadge` |
| 4 | Gender | `genderTag` | Colored pill |
| 5 | Age | `ageGroup` | Formatted label (e.g. "6–8 yrs") |
| 6 | Pages | `_count.pages` / `pageCount` | Warning chip when `_count.pages !== pageCount` |
| 7 | Theme | `theme.name` | Or "—" if null |
| 8 | Created | `createdAt` | Formatted date |
| 9 | Actions | — | `ComicRowActions` |

Empty state: "No Comics Yet" with "Create Your First Comic" button.

---

## Step 1.7 — `ComicListPageHeader.tsx`

- BookOpen icon + "Comics" title + subtitle
- "Add Comic" button → navigates to `/admin/comics/new`

---

## Step 1.8 — `comics/page.tsx` (REPLACE)

Replaces the placeholder. Wires together:
- `ComicListPageHeader`
- `ComicListFilters` (filter state managed here)
- `ComicListTable` with paginated slice of data
- `ComicPagination`
- `ComicDeleteDialog`
- Loading skeletons, error state with retry

Uses `useComics(filters)` hook. The filters pass through to the API. Pagination is client-side (slice the array).

---

# PHASE 2 — COMIC CREATE WIZARD (Steps 1–2)

**Goal:** `/admin/comics/new` — one screen, one submit.

---

## Step 2.1 — `comicCreateSchema.ts` (Zod schema)

```ts
const comicCreateSchema = z.object({
  title: z.string().min(1).max(255),
  genderTag: z.nativeEnum(GenderTag),
  pageCount: z.number().int().positive(),
  freePreviewPages: z.number().int().min(0),
  description: z.string().min(1).optional().or(z.literal("")),
  themeId: z.string().uuid().optional().or(z.literal("")),
  ageGroup: z.nativeEnum(AgeGroup).optional(),
  isBestseller: z.boolean().default(false),
}).refine(data => data.freePreviewPages < data.pageCount, {
  message: "Free preview pages must be less than total page count",
  path: ["freePreviewPages"],
});
```

Thumbnails and pricing are validated separately (they're not simple form fields).

---

## Step 2.2 — `ThumbnailUploader.tsx`

Multi-file upload component:

**State:** `File[]` + `previewUrls: string[]` (object URLs)

**Features:**
- Click-to-browse or drag-and-drop zone
- Accepts `image/png`, `image/jpeg`, `image/webp` — NO SVG (§3 STEP 1)
- Min 1, max 10 files total
- Preview grid with drag-to-reorder (using `@dnd-kit` — already installed)
- First item shows "Primary" badge
- Remove button per thumbnail
- Upload progress (uses existing `uploadToR2` from `app/lib/r2-upload.ts`)

**On form submit (not on file select):**
1. Call `getThumbnailUploadUrls(files)` — one call for all files
2. `Promise.all` the PUTs (parallel is safe for thumbnails)
3. Collect `keys` in display order → pass to parent as `thumbnailKeys`

---

## Step 2.3 — `PricingGrid.tsx`

**Reads countries from `useCountries()`** (already built).

**Layout:** A grid/table with:
- Rows: one per country (flag + name + currency code)
- Columns: HARDCOVER price | SOFTCOVER price
- Each cell: a number input

**Validation:**
- Every cell must have a value > 0 (all countries × both cover types required per user's answer)
- No duplicate `[countryId, coverType]` pairs (ensured by grid structure)

**On submit:** flatten to array: `[{ countryId, coverType: "HARDCOVER", price: number }, ...]`

**Edge case:** If zero countries exist, show a warning: "You must create at least one country before creating a comic" with a link to `/admin/countries`.

---

## Step 2.4 — `ComicDetailsFields.tsx`

The non-upload form fields:

| Field | Input Type | Validation | Notes |
|---|---|---|---|
| `title` | Text input | 1–255 chars, required | |
| `genderTag` | Select dropdown | Required | BOY / GIRL / UNISEX |
| `pageCount` | Number input | Integer > 0, required | |
| `freePreviewPages` | Number input | Integer ≥ 0, < pageCount | Cross-field validation |
| `description` | Textarea | Optional, min 1 if present | |
| `themeId` | Select dropdown | Optional | Populated from `useThemes()` |
| `ageGroup` | Select dropdown | Optional | AGE_0_2 / AGE_3_5 / AGE_6_8 / AGE_9_12 |
| `isBestseller` | Toggle/checkbox | Optional, default false | |

All wired to react-hook-form with the zod resolver.

---

## Step 2.5 — `CreateComicForm.tsx`

The parent form component that combines:
1. `ComicDetailsFields` (top)
2. `ThumbnailUploader` (middle)
3. `PricingGrid` (bottom)
4. Submit button

**Submit flow:**
1. Validate form with zod
2. Validate thumbnails (min 1 selected)
3. Validate pricing (all cells filled)
4. Upload thumbnails to R2 → get `thumbnailKeys`
5. Call `createComic({ ...formData, thumbnailKeys, pricing })`
6. On success → redirect to `/admin/comics/:comicId/fonts` (or the detail hub — per user's choice)
7. On error → show error toast, stay on page

**Loading states:** "Uploading thumbnails..." → "Creating comic..." with a progress indicator

---

## Step 2.6 — `comics/new/page.tsx`

The page file. Renders:
- Page header: "Create New Comic" with a back link to `/admin/comics`
- `CreateComicForm`

---

# PHASE 3 — COMIC DETAIL HUB

**Goal:** `/admin/comics/[comicId]` — the central management page.

---

## Step 3.1 — `ComicTabBar.tsx`

Client-side tab bar. Tabs:
- **Overview** (default) — shows `ComicInfoEditor` + `ThumbnailManager`
- **Fonts** — shows `FontList`
- **Pages** — shows `PageList`
- **Pricing** — shows `PricingEditor`
- **Review** — shows `PrePublishChecklist` + `PublishButton`

Active tab stored in component state. No URL change.

---

## Step 3.2 — `ComicSummaryCard.tsx`

Always visible at the top of the hub, regardless of active tab. Shows:
- Primary thumbnail (small)
- Title (bold)
- Status badge (`ComicStatusBadge`)
- Quick stats: "12/24 pages uploaded" · "3 fonts" · "47 bubbles"
- Back to list link

---

## Step 3.3 — `ComicInfoEditor.tsx`

Inline-editable fields. Two states:

**View mode:** displays all fields as read-only text with an "Edit" button.

**Edit mode:** fields become inputs (same as `ComicDetailsFields` but pre-filled). "Save" and "Cancel" buttons. On save → calls `useUpdateComic().mutateAsync()`.

**Special handling:**
- `freePreviewPages` on update must be > 0 (NOT ≥ 0 like create — §4.1 inconsistency)
- `freePreviewPages < pageCount` is NOT server-enforced on update — validate client-side
- `themeId` cannot be cleared once set — disable the "clear" option, only allow switching

Uses react-hook-form + a separate zod schema for update (slightly different rules than create).

---

## Step 3.4 — `ThumbnailManager.tsx`

Shows current thumbnails from `comic.coverThumbnailUrls` in a drag-to-reorder grid.

**Operations (all via `setThumbnails` helper — §4.1.1):**

| Operation | How |
|---|---|
| **Delete** | Filter out the URL, send remaining. Confirm first (R2 deletion is permanent). Disable ✕ when only 1 thumbnail remains |
| **Add** | Upload new file(s) → get keys → append to existing URLs → send combined array |
| **Reorder** | Drag-and-drop → send same URLs in new order |
| **Set Primary** | Move to index 0 (just a reorder). Show "Primary" badge on `[0]` |

**Key rule:** always send the COMPLETE desired array. Omission = permanent deletion.

Warn when deleting index 0 (it changes the catalogue card cover).

---

## Step 3.5 — `ComicDetailHub.tsx`

The main orchestrator. Fetches `useComic(comicId)` (the full tree endpoint).

Layout:
```
┌─────────────────────────────────────────────┐
│ ComicSummaryCard                            │
├─────────────────────────────────────────────┤
│ ComicTabBar (Overview | Fonts | Pages | … ) │
├─────────────────────────────────────────────┤
│ Tab Content Area                            │
│ (renders the component for the active tab)  │
└─────────────────────────────────────────────┘
```

---

## Step 3.6 — `comics/[comicId]/page.tsx`

The page file. Extracts `comicId` from `params`. Renders `ComicDetailHub`.

Handles 404 if comic doesn't exist (show "Comic not found" with link back to list).

---

# PHASE 4 — FONT MANAGEMENT

**Goal:** The "Fonts" tab inside the comic detail hub.

---

## Step 4.1 — `FontList.tsx`

Table showing all fonts for this comic:

| Column | Source | Notes |
|---|---|---|
| Font Name | `name` | Bold text |
| File Type | Extracted from `fileUrl` extension | Badge (TTF/OTF/etc.) |
| Bubbles Using | `_count.bubbles` | Number badge |
| Created | `createdAt` | Formatted date |
| Actions | — | Edit button, Delete button (disabled if `_count.bubbles > 0`) |

"Add Font" button at top.

Empty state: "No Fonts Yet — Upload your first font to start mapping bubbles."

---

## Step 4.2 — `FontUploadModal.tsx`

Modal for adding a new font:

**Fields:**
- Display Name — text input (required, min 1)
- Font File — file picker (`.ttf`, `.otf`, `.woff`, `.woff2`)

**Submit flow (STRICTLY SEQUENTIAL — §9.8):**
1. Determine `fileExtension` from the file
2. Call `requestFontUploadUrl(comicId, { fileName, fileExtension })`
3. PUT the file to R2 with correct content-type (`font/ttf`, etc.)
4. Call `createFont(comicId, { name, fontKey })`
5. Invalidate `["comic", comicId, "fonts"]`

🔴 **If uploading multiple fonts, each must be fully completed before starting the next.** Font keys use `Date.now()` with no random component — parallel uploads can collide.

---

## Step 4.3 — `FontEditModal.tsx`

Modal for editing an existing font:

- Edit display name
- Optionally replace the font file (new upload)
- On save → `updateFont(fontId, { name?, fontKey? })`

---

## Step 4.4 — `FontDeleteDialog.tsx`

Confirmation dialog. If `_count.bubbles > 0`, the backend returns 409. Show the error verbatim: *"Cannot delete font "ComicSans-Bold" — 47 bubble(s) reference it."*

---

# PHASE 5 — PAGE MANAGEMENT

**Goal:** The "Pages" tab inside the comic detail hub.

---

## Step 5.1 — `PageCard.tsx`

Card for a single page:
- **Artwork thumbnail** — `artworkUrl` displayed as image, or a placeholder if null
- **Page number** badge (top-left)
- **Status indicators:**
  - 🟢 Artwork uploaded / ⚪ No artwork
  - 🟢 Mask uploaded / ⚪ No mask (only relevant if `hasFace: true`)
  - 👤 `hasFace` indicator
  - 👁️ `isPreviewPage` indicator
  - 💬 Bubble count (from nested `bubbles.length`)
- **Actions:** Edit button, "Map Bubbles" button (→ opens bubble mapper), Delete button

---

## Step 5.2 — `PageList.tsx`

A responsive card grid of `PageCard` components, sorted by `pageNumber` ascending.

"Add Page" button at top.

Shows a warning banner if `pages.length !== comic.pageCount`:
- "12 of 24 pages created — 12 remaining"

Empty state: "No Pages Yet — Start by adding your first page."

---

## Step 5.3 — `PageCreateModal.tsx`

Modal for creating a new page. This is complex because of the dual file upload.

**Fields:**

| Field | Input | Required | Notes |
|---|---|---|---|
| `pageNumber` | Number input (auto-suggested: next available) | ✅ | Integer > 0, unique within comic, immutable after creation |
| Artwork File | File picker (PNG/JPEG/WEBP) | ❌ | Optional at create time |
| Mask File | File picker (PNG/JPEG/WEBP) | ❌ | Only visible if `hasFace` is toggled on |
| `hasFace` | Toggle | ❌ | Default false |
| `mirrorFace` | Toggle | ❌ | Default false. Only visible if `hasFace` |
| `faceDirection` | Select (front/three-quarter/side) | ❌ | Only visible if `hasFace` |
| `isPreviewPage` | Toggle | ❌ | Default false |
| `pagePrompt` | Textarea | ❌ | AI generation prompt |
| `steps` | Number input (1–8) | ❌ | Behind "Advanced" collapsible, default 3 |
| `cfg` | Number input (1.0–3.0) | ❌ | Behind "Advanced" collapsible, default 1.0 |

**Submit flow:**
1. If artwork file selected:
   - `requestPageUploadUrl(comicId, { fileExtension, fileType: "artwork" })`
   - PUT to R2
2. If mask file selected:
   - `requestPageUploadUrl(comicId, { fileExtension, fileType: "masks" })` ← PLURAL
   - PUT to R2
3. Both artwork and mask PUTs for a single page CAN run in parallel
4. Call `createPage(comicId, { pageNumber, artworkUrl: artworkKey, maskUrl: maskKey, hasFace, ... })`
   - ⚠️ Field names say `Url` but send the KEY
5. Handle 409: "Page number 1 already exists for this comic"
6. Handle 400: "Mask dimensions must match artwork dimensions"

---

## Step 5.4 — `PageEditModal.tsx`

Modal for editing an existing page:

- All fields editable except `pageNumber` (immutable)
- Existing artwork/mask shown as preview
- Can replace artwork and/or mask via new upload

**🔴 Critical gotcha (§9.2):** When replacing artwork on a page that already has a mask, BOTH keys must be sent in the same PATCH. Otherwise the backend rejects because the existing mask dimensions won't match the new artwork.

**Response handling:**
- Check `warnings` array. If non-empty, show a warning banner: "Artwork aspect ratio changed — re-check bubble positions"
- Handle 400: dimension mismatch

---

## Step 5.5 — `PageDeleteDialog.tsx`

Confirmation dialog that names the bubble count:
- "This will permanently delete Page 3 and its **12 bubbles**. This cannot be undone."
- No 409 — cascade is immediate

---

# PHASE 6 — BUBBLE MAPPER

**Goal:** The most complex screen. Canvas-based bubble placement.

---

## Step 6.1 — `bubbleCoordinates.ts`

Pure utility functions. The ONLY place where pixel ↔ fraction conversion happens:

```ts
// Convert pixel rect to API fractions
export function toApi(rect: PixelRect, displayWidth: number, displayHeight: number): ApiFractions {
  return {
    x: rect.x / displayWidth,
    y: rect.y / displayHeight,
    width: rect.width / displayWidth,
    height: rect.height / displayHeight,
  };
}

// Convert API fractions to pixel rect
export function fromApi(bubble: ApiFractions, displayWidth: number, displayHeight: number): PixelRect {
  return {
    x: bubble.x * displayWidth,
    y: bubble.y * displayHeight,
    width: bubble.width * displayWidth,
    height: bubble.height * displayHeight,
  };
}

// Clamp to keep bubble within artwork bounds
export function clampRect(rect: PixelRect, maxWidth: number, maxHeight: number): PixelRect {
  const width = Math.min(rect.width, maxWidth);
  const height = Math.min(rect.height, maxHeight);
  return {
    x: Math.max(0, Math.min(rect.x, maxWidth - width)),
    y: Math.max(0, Math.min(rect.y, maxHeight - height)),
    width, height,
  };
}
```

---

## Step 6.2 — `BubbleDialogueEditor.tsx`

Textarea + token insertion toolbar:

**Token buttons:** `{name}`, `{pronoun_subject}`, `{pronoun_object}`, `{pronoun_possessive}`

Clicking a button inserts the token at the cursor position in the textarea.

**Client-side token linting:** After every edit, scan for `{...}` patterns. If any token is NOT one of the four valid ones, show a warning: *"Unknown token `{Name}` — will appear literally in the printed book. Valid tokens: {name}, {pronoun_subject}, {pronoun_object}, {pronoun_possessive}"*

**Live preview:** Replace tokens with sample values ("Aarav", "he", "him", "his") and show the rendered text below the textarea.

---

## Step 6.3 — `BubblePanel.tsx`

Side panel (right side of the mapper) showing:

**For the selected bubble:**
- Dialogue editor (`BubbleDialogueEditor`)
- Font picker — dropdown populated from `useFonts(comicId)` ONLY (§9.4). Shows "No font" as an option (omit `fontId` on create, send `null` on update)
- Font size — pixel input. Shows the equivalent pixel value: `fontSize × artworkHeight`. On change, converts back: `newPx / artworkHeight`. Range: 0.005–0.25 in fractions
- Sort order — number input
- Position display — read-only showing x, y, width, height in pixels
- Delete bubble button

**When no bubble selected:**
- "Click a bubble on the canvas to edit it, or click 'Add Bubble' to create one."

---

## Step 6.4 — `BubbleToolbar.tsx`

Top toolbar above the canvas:
- **Add Bubble** button — creates a default bubble at center (x:0.3, y:0.3, width:0.2, height:0.1)
- **Zoom controls** — zoom in, zoom out, reset zoom, current zoom percentage
- **Delete Selected** — deletes the currently selected bubble
- **Back to Pages** — link back to the Pages tab

---

## Step 6.5 — `BubbleMapperCanvas.tsx`

The core react-konva component:

```
<Stage width={containerWidth} height={containerHeight} scaleX={zoom} scaleY={zoom} draggable>
  <Layer>
    <KonvaImage image={artwork} />     // from useImage(page.artworkUrl)
    {bubbles.map(b => (
      <Rect                             // denormalized to stage pixels
        x={b.x * displayWidth}
        y={b.y * displayHeight}
        width={b.width * displayWidth}
        height={b.height * displayHeight}
        stroke="#00A3FF" strokeWidth={2}
        fill="rgba(0,163,255,0.1)"
        draggable
        dragBoundFunc={...}             // clamp within artwork bounds
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={() => selectBubble(b.id)}
      />
    ))}
    <Transformer ref={transformerRef} />  // attach to selected Rect
  </Layer>
</Stage>
```

**Key behaviors:**
- `onDragEnd`: convert pixel position to fractions via `toApi()`, call `updateBubble(bubbleId, { x, y })`. Debounced 300ms
- `onTransformEnd`: convert position + size to fractions, call `updateBubble(bubbleId, { x, y, width, height })`. Debounced 300ms
- `dragBoundFunc`: clamp so bubble stays within artwork (0 ≤ x, x+width ≤ displayWidth, etc.)
- Transformer's `boundBoxFunc`: same clamping for resize
- Selected bubble highlighted with different stroke color
- Bubble label text (dialogue preview, first ~20 chars) rendered inside or above each Rect

---

## Step 6.6 — Bubble Mapper Page (`comics/[comicId]/pages/[pageId]/bubbles/page.tsx`)

The page file. Extracts `comicId` and `pageId` from params.

Fetches page data from `usePages(comicId)` (find the matching page), or `useBubbles(pageId)` for a lighter payload.

Also fetches `useFonts(comicId)` for the font picker.

Layout:
```
┌──────────────────────────────────────────────────────────┐
│ BubbleToolbar                                            │
├──────────────────────────────────┬───────────────────────┤
│                                  │                       │
│   BubbleMapperCanvas             │   BubblePanel         │
│   (70% width)                    │   (30% width)         │
│                                  │                       │
└──────────────────────────────────┴───────────────────────┘
```

---

# PHASE 7 — PRICING EDITOR

**Goal:** The "Pricing" tab inside the comic detail hub.

---

## Step 7.1 — `PricingEditor.tsx`

Same grid layout as `PricingGrid.tsx` from the create form, but:

**Data source:** `usePricing(comicId)` which calls `GET /api/admin/comics/:comicId/pricing`

**Key difference from create:**
- Reads existing rules and pre-fills the grid
- Uses `PUT /api/admin/comics/:comicId/pricing` for updates (full replacement)
- `price` comes back as STRING `"1499.00"` — must `parseFloat()` for display
- `price` must be sent as NUMBER — `parseFloat(inputValue)` on submit

**Save behavior:** "Save Pricing" button. Collects all cells, validates > 0, sends the full array.

**If a country was added to the system after the comic was created:** That country row appears empty in the grid. The admin fills in prices for it.

**If a country was deleted:** Its pricing rules no longer exist (cascade delete at the country level). The grid shows only currently-existing countries.

---

# PHASE 8 — PRE-PUBLISH CHECKLIST + PUBLISH

**Goal:** The "Review" tab inside the comic detail hub.

---

## Step 8.1 — `PrePublishChecklist.tsx`

10 checklist items, all evaluated from the data in `useComic(comicId)` (the full tree response):

| # | Check | How to evaluate | Severity |
|---|---|---|---|
| 1 | At least 1 thumbnail | `comic.coverThumbnailUrls.length > 0` | 🔴 Blocks publish (server-enforced) |
| 2 | At least 1 pricing rule | `comic.pricingRules.length > 0` | 🔴 Blocks publish (server-enforced) |
| 3 | Every country has BOTH cover types | Group `pricingRules` by `countryId`, check each has HARDCOVER + SOFTCOVER | 🔴 Client responsibility |
| 4 | Page count matches | `comic.pages.length === comic.pageCount` | 🔴 Client responsibility |
| 5 | Contiguous page numbers 1..N | Sort pages, check `[1, 2, 3, ..., pageCount]` with no gaps | 🔴 Client responsibility |
| 6 | Every page has artwork | `comic.pages.every(p => p.artworkUrl !== null)` | 🔴 Client responsibility |
| 7 | Every hasFace page has a mask | `comic.pages.filter(p => p.hasFace).every(p => p.maskUrl !== null)` | 🔴 Client responsibility |
| 8 | Preview page count matches | `comic.pages.filter(p => p.isPreviewPage).length === comic.freePreviewPages` | 🔴 Client responsibility |
| 9 | Every bubble has a font | `comic.pages.flatMap(p => p.bubbles).every(b => b.fontId !== null)` | 🟡 Advisory |
| 10 | No invalid dialogue tokens | Regex scan for `{...}` not matching valid tokens | 🟡 Advisory |

**Display:** Green ✅ or red ❌ per item. Items 1–8 must all pass to enable the publish button. Items 9–10 show warnings but don't block.

---

## Step 8.2 — `PublishButton.tsx`

**When all blocking checks pass:**
- Show "Publish Comic" button (green)
- On click → call `updateComicStatus(comicId, "PUBLISHED")`
- Brief spinner (synchronous flip, no progress bar — §3 STEP 6)
- On success → toast "Comic published!" + invalidate queries
- On error → show error message (the 400 messages from the server are descriptive)

**When checks fail:**
- Button disabled with tooltip listing what's missing

**When comic is already PUBLISHED:**
- Show "Unpublish" button (amber) → `updateComicStatus(comicId, "UNPUBLISHED")`

**When comic is UNPUBLISHED:**
- Show both "Publish" (re-publish) and "Revert to Draft" buttons

---

# VERIFICATION PLAN — Manual Testing Instructions

After all phases are built, follow this sequence to test end-to-end. Each step depends on the previous one.

---

## Pre-requisite Check

1. **Ensure at least 2 countries exist** — go to `/admin/countries`. If empty, create:
   - India (IN, INR) with a flag image
   - United States (US, USD) with a flag image
2. **Ensure at least 1 theme exists** — go to `/admin/themes`. If empty, create "Space Adventure"
3. **Backend is running** at `http://localhost:8080`

---

## Test 1: Comic List (Phase 1)

1. Navigate to `/admin/comics`
2. ✅ Verify the page loads without errors (empty state: "No Comics Yet")
3. ✅ Verify the "Add Comic" button is visible top-right
4. ✅ Verify the filter bar is visible (Gender, Age Group, Theme, Search)
5. ✅ Verify "Countries" and "Themes" still work in the sidebar (no regressions)

---

## Test 2: Create Comic (Phase 2)

1. Click "Add Comic" → should navigate to `/admin/comics/new`
2. Fill in comic details:
   - Title: "Captain Aarav and the Lost Star"
   - Gender: BOY
   - Page Count: 3
   - Free Preview Pages: 1
   - Description: "A brave young astronaut"
   - Theme: "Space Adventure"
   - Age Group: 6–8
3. Upload 2 thumbnail images (PNG or JPEG)
4. ✅ Verify thumbnail previews appear with "Primary" badge on the first
5. ✅ Try drag-to-reorder thumbnails — primary badge should move
6. Fill pricing for ALL countries × BOTH cover types:
   - India: HARDCOVER ₹1499, SOFTCOVER ₹999
   - US: HARDCOVER $29.99, SOFTCOVER $19.99
7. Click "Create Comic"
8. ✅ Verify loading state shows "Uploading thumbnails..." then "Creating comic..."
9. ✅ Verify redirect to the comic detail hub
10. ✅ Go back to `/admin/comics` — verify the comic appears in the table with DRAFT status

**Validation tests:**
11. Try submitting without a title → ✅ Should show validation error
12. Try submitting with `freePreviewPages` = `pageCount` → ✅ Should show "must be less than"
13. Try submitting without thumbnails → ✅ Should show "at least 1 thumbnail required"
14. Try submitting with empty pricing → ✅ Should show pricing error

---

## Test 3: Comic Detail Hub (Phase 3)

1. From the list, click on the comic title → should open `/admin/comics/:id`
2. ✅ Verify the summary card shows: title, DRAFT badge, "0/3 pages", thumbnail
3. ✅ Verify tab bar is visible: Overview | Fonts | Pages | Pricing | Review

**Test 3a: Inline Editing**
4. On the Overview tab, click "Edit"
5. Change the title to "Captain Aarav v2"
6. Click "Save"
7. ✅ Verify the title updates in the summary card
8. ✅ Verify the change persists (refresh the page)

**Test 3b: Thumbnail Management**
9. On the Overview tab, in the thumbnail section:
10. Click "Add" → upload a 3rd thumbnail
11. ✅ Verify it appears in the grid
12. Drag-reorder thumbnails
13. ✅ Verify the "Primary" badge moves to the new first item
14. Delete the 3rd thumbnail (click ✕)
15. ✅ Verify confirmation dialog appears
16. Confirm → ✅ Verify it disappears
17. Try deleting when only 1 thumbnail remains → ✅ Button should be disabled with tooltip

---

## Test 4: Font Management (Phase 4)

1. Switch to the "Fonts" tab
2. ✅ Verify empty state message
3. Click "Add Font"
4. Enter name: "ComicSans-Bold", select a `.ttf` file
5. ✅ Verify upload progress
6. ✅ Verify font appears in the list with "0 bubbles" count
7. Add a second font: "Adventure-Regular"
8. ✅ Verify both appear
9. Edit "ComicSans-Bold" → change name to "ComicSans-BoldItalic" → Save
10. ✅ Verify name updates
11. Delete "Adventure-Regular" (no bubbles referencing it)
12. ✅ Verify it disappears

---

## Test 5: Page Management (Phase 5)

1. Switch to the "Pages" tab
2. ✅ Verify warning: "0 of 3 pages created — 3 remaining"
3. Click "Add Page"
4. ✅ Verify page number auto-suggests 1
5. Upload an artwork PNG (e.g. 2048×1536)
6. Toggle `hasFace` ON → upload a mask PNG (SAME dimensions as artwork)
7. Toggle `isPreviewPage` ON
8. Click Create
9. ✅ Verify page card appears with artwork thumbnail, page number badge, hasFace indicator
10. Add Page 2 (with artwork, no face, not a preview)
11. Add Page 3 (with artwork, no face, not a preview)
12. ✅ Verify warning disappears (3/3 pages)

**Error tests:**
13. Try adding another Page 1 → ✅ Should show 409 "already exists"
14. Try uploading a mask with different dimensions than artwork → ✅ Should show 400 "dimensions must match"

**Delete test:**
15. Delete Page 3
16. ✅ Verify confirmation dialog shows bubble count
17. Confirm → ✅ Page disappears, warning reappears "2 of 3 pages"

---

## Test 6: Bubble Mapper (Phase 6)

1. From the Pages tab, click "Map Bubbles" on Page 1
2. ✅ Verify the mapper opens showing the artwork image
3. ✅ Verify zoom controls work (zoom in, zoom out, reset)
4. ✅ Verify pan works (drag the background)

**Add bubbles:**
5. Click "Add Bubble"
6. ✅ Verify a blue rectangle appears on the artwork
7. Drag it to a speech balloon area
8. ✅ Verify it stays within artwork bounds (can't drag outside)
9. Resize it using corner handles
10. ✅ Verify it stays within bounds on resize

**Edit bubble:**
11. Click the bubble → side panel should show its details
12. Type dialogue: "Look, {name}! A shooting star!"
13. ✅ Verify the live preview shows: "Look, Aarav! A shooting star!"
14. Select font: "ComicSans-BoldItalic" from the picker
15. Change font size to 30px
16. ✅ Verify the fraction conversion is correct (30 / artworkHeight)

**Token validation:**
17. Type `{Name}` (capital N) in the dialogue
18. ✅ Verify a warning appears: "Unknown token {Name}"
19. Use the token toolbar to insert `{pronoun_subject}`
20. ✅ Verify it inserts at cursor position

**Add more bubbles:**
21. Add a second bubble on the same page
22. ✅ Verify both appear as selectable rectangles
23. Click between them to switch selection

**Delete bubble:**
24. Select a bubble, click "Delete Selected"
25. ✅ Verify it disappears

26. Click "Back to Pages" → verify you return to the Pages tab

---

## Test 7: Pricing Editor (Phase 7)

1. Switch to the "Pricing" tab
2. ✅ Verify the grid shows existing pricing (India + US, HARDCOVER + SOFTCOVER)
3. ✅ Verify prices are displayed correctly (parsed from string)
4. Change India HARDCOVER from 1499 to 1599
5. Click "Save Pricing"
6. ✅ Verify success toast
7. Refresh → ✅ Verify 1599 persists

---

## Test 8: Pre-Publish Checklist + Publish (Phase 8)

1. Switch to the "Review" tab
2. ✅ Verify the 10-item checklist is displayed
3. Since we deleted Page 3 earlier, check #4 should fail: "2 of 3 pages (expected 3)"
4. ✅ Verify Publish button is disabled

**Fix the issue:**
5. Go to Pages tab → Add Page 3 back (with artwork)
6. Return to Review tab
7. ✅ Verify check #4 now passes
8. If check #8 fails (preview count mismatch), fix by toggling appropriate pages

**Publish:**
9. Click "Publish Comic"
10. ✅ Verify brief spinner
11. ✅ Verify status changes to PUBLISHED in the summary card
12. ✅ Verify success toast

**Unpublish:**
13. ✅ Verify "Unpublish" button now appears
14. Click "Unpublish"
15. ✅ Verify status changes to UNPUBLISHED

---

## Test 9: Comic List Actions (Phase 1 revisited)

1. Navigate to `/admin/comics`
2. ✅ Verify the comic shows with UNPUBLISHED status badge
3. Click the three-dot menu → ✅ Verify actions appear
4. Click "Publish" → ✅ Verify status flips to PUBLISHED
5. Click three-dot → Click "Unpublish" → ✅ Verify status flips
6. Try "Delete" on a PUBLISHED comic → ✅ Should be hidden or disabled

**Delete test:**
7. Unpublish the comic first
8. Click "Delete" → type-to-confirm dialog appears
9. Type the wrong title → ✅ Delete button stays disabled
10. Type the correct title → ✅ Delete button enables
11. Click Delete → ✅ Comic removed from list

---

## Test 10: Filters and Pagination (Phase 1)

1. Create 12+ comics (to test pagination)
2. ✅ Verify pagination shows "Showing 1–10 of 12"
3. Click Next → ✅ Shows remaining comics
4. Use Gender filter (BOY) → ✅ Only BOY comics show
5. Use Search ("Captain") → ✅ Only matching comics show
6. Use Theme filter → ✅ Filters correctly
7. Click "Clear Filters" → ✅ All comics show again

---

## Test 11: Edge Cases

1. **Zero countries** — Go to `/admin/comics/new`. ✅ Should show warning about needing countries
2. **Concurrent tab** — Open the comic in two tabs. Edit title in one → ✅ Refresh the other shows the update (TanStack Query staleTime handles this)
3. **Network error** — Stop the backend. Try loading comics → ✅ Error state with "Try Again"
4. **Large comic** — Create a comic with 24 pages, each with 5 bubbles. ✅ Verify the mapper handles it smoothly

---

> [!TIP]
> **Thin-slice first test (recommended by the doc §12):** Create 1 country → 1 theme → 1 comic with 1 thumbnail + 1 pricing rule → 1 font → 1 page with artwork → 1 bubble → publish → verify in the comic list as PUBLISHED. This proves every layer before building breadth.
