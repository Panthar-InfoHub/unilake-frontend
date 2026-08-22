import api from "@/app/lib/axios";
import type { Font, FontWithCount, UploadUrlResponse } from "@/app/types/comic";

export async function fetchFonts(comicId: string): Promise<FontWithCount[]> {
  const { data } = await api.get<FontWithCount[]>(`/api/admin/comics/${comicId}/fonts`);
  return data;
}

export async function requestFontUploadUrl(comicId: string, payload: { fileName: string, fileExtension: string }): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>(`/api/admin/comics/${comicId}/fonts/upload-url`, payload);
  return data;
}

export async function createFont(comicId: string, payload: { name: string, fontKey: string }): Promise<Font> {
  const { data } = await api.post<Font>(`/api/admin/comics/${comicId}/fonts`, payload);
  return data;
}

export async function updateFont(fontId: string, payload: { name?: string, fontKey?: string }): Promise<Font> {
  const { data } = await api.patch<Font>(`/api/admin/fonts/${fontId}`, payload);
  return data;
}

export async function deleteFont(fontId: string): Promise<void> {
  await api.delete(`/api/admin/fonts/${fontId}`);
}
