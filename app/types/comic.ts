export enum GenderTag {
  BOY = "BOY",
  GIRL = "GIRL",
  UNISEX = "UNISEX",
}

export enum AgeGroup {
  AGE_0_2 = "AGE_0_2",
  AGE_3_5 = "AGE_3_5",
  AGE_6_8 = "AGE_6_8",
  AGE_9_12 = "AGE_9_12",
}

export enum CoverType {
  HARDCOVER = "HARDCOVER",
  SOFTCOVER = "SOFTCOVER",
}

export enum ComicStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  UNPUBLISHED = "UNPUBLISHED",
  PUBLISHING = "PUBLISHING",
}

export enum FaceDirection {
  FRONT = "front",
  THREE_QUARTER = "three-quarter",
  SIDE = "side",
}

export enum FontExtension {
  TTF = "ttf",
  OTF = "otf",
  WOFF = "woff",
  WOFF2 = "woff2",
}

export enum PageFileType {
  ARTWORK = "artwork",
  MASKS = "masks",
}

export enum PageFileExtension {
  JPG = "jpg",
  JPEG = "jpeg",
  PNG = "png",
  WEBP = "webp",
}

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


// NOTE: There is intentionally no `rotation` field. The backend `Bubble` model
// stores 8 fields only (x, y, width, height, dialogue, fontId, fontSize,
// sortOrder) and validateBody strips anything else silently — a rotation sent
// here would save with a 200 and vanish on reload.
// Removed 2026-08-01. To add it later: rotation column + migration, both Zod
// schemas, rotation support in the Sharp text stamper, and a decision on whether
// the x+width<=1 bound applies to the rotated bounding box or the unrotated one.
// Cheapest to do BEFORE the SD worker is written.

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
  price: string;         // comes as STRING from API
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
