import api from "@/app/lib/axios";
import type {
  Comic,
  ComicListItem,
  ComicDetail,
  CreateComicPayload,
  ThumbnailUploadResponse,
  PricingRuleWithCountry,
  ComicStatus,
  PublicComicListItem,
  PublicComicDetail
} from "@/app/types/comic";

export async function fetchComics(filters?: { gender?: string, ageGroup?: string, themeId?: string, search?: string }): Promise<ComicListItem[]> {
  const params = new URLSearchParams();

  if (filters?.gender) params.append("gender", filters.gender);
  if (filters?.ageGroup) params.append("ageGroup", filters.ageGroup);
  if (filters?.themeId) params.append("themeId", filters.themeId);
  if (filters?.search) params.append("search", filters.search);

  const { data } = await api.get<ComicListItem[]>(`/api/admin/comics?${params.toString()}`);
  return data;
}

export async function fetchComic(id: string): Promise<ComicDetail> {
  const { data } = await api.get<ComicDetail>(`/api/admin/comics/${id}`);
  return data;
}

export async function createComic(payload: CreateComicPayload): Promise<Comic> {
  const { data } = await api.post<Comic>("/api/admin/comics", payload);
  return data;
}

export async function updateComic(id: string, payload: Partial<Comic> & { thumbnailKeys?: string[] }): Promise<Comic> {
  const { data } = await api.patch<Comic>(`/api/admin/comics/${id}`, payload);
  return data;
}

export async function deleteComic(id: string): Promise<void> {
  await api.delete(`/api/admin/comics/${id}`);
}

export async function updateComicStatus(id: string, status: ComicStatus): Promise<Comic> {
  const { data } = await api.patch<Comic>(`/api/admin/comics/${id}/status`, { status });
  return data;
}

export async function getThumbnailUploadUrls(files: { fileName: string, contentType: string }[]): Promise<ThumbnailUploadResponse> {
  const { data } = await api.post<ThumbnailUploadResponse>("/api/admin/comics/thumbnails/upload-urls", { files });
  return data;
}

export async function setThumbnails(comicId: string, desired: string[]): Promise<Comic> {
  if (desired.length === 0) {
    throw new Error("A comic must keep at least one thumbnail");
  }
  if (desired.length > 10) {
    throw new Error("Maximum 10 thumbnails per comic");
  }
  return updateComic(comicId, { thumbnailKeys: desired });
}

export async function fetchPricing(id: string): Promise<PricingRuleWithCountry[]> {
  const { data } = await api.get<PricingRuleWithCountry[]>(`/api/admin/comics/${id}/pricing`);
  return data;
}

export async function updatePricing(id: string, pricing: { countryId: string; coverType: string; price: number }[]): Promise<Comic> {
  const { data } = await api.put<Comic>(`/api/admin/comics/${id}/pricing`, { pricing });
  return data;
}

export async function fetchPublicComics(filters?: {
  gender?: string;
  ageGroup?: string;
  themeId?: string;
  search?: string;
}): Promise<PublicComicListItem[]> {
  const params = new URLSearchParams();

  if (filters?.gender) params.append("gender", filters.gender);
  if (filters?.ageGroup) params.append("ageGroup", filters.ageGroup);
  if (filters?.themeId) params.append("themeId", filters.themeId);
  if (filters?.search) params.append("search", filters.search);

  const query = params.toString();
  const { data } = await api.get<PublicComicListItem[]>(
    `/api/public/comics${query ? `?${query}` : ""}`
  );
  return data;
}

export async function fetchPublicComic(comicId: string): Promise<PublicComicDetail> {
  const { data } = await api.get<PublicComicDetail>(`/api/public/comics/${comicId}`);
  return data;
}

