import api from "@/app/lib/axios";
import {
  CreateSessionResponse,
  GenerateResponse,
  PhotoConfirmResponse,
  PhotoUploadUrlResponse,
  RegenerateResponse,
  SessionSnapshot,
} from "@/app/types/session";

export async function createSession(comicId: string): Promise<CreateSessionResponse> {
  const { data } = await api.post<CreateSessionResponse>("/api/public/sessions", { comicId });
  return data;
}

export async function updateSession(
  sessionId: string,
  payload: {
    childName?: string;
    age?: number;
    pronounKey?: string;
    notificationEmail?: string;
  }
): Promise<SessionSnapshot> {
  const { data } = await api.patch<SessionSnapshot>(`/api/public/sessions/${sessionId}`, payload);
  return data;
}

export async function getSession(sessionId: string): Promise<SessionSnapshot> {
  const { data } = await api.get<SessionSnapshot>(`/api/public/sessions/${sessionId}`);
  return data;
}

export async function getPhotoUploadUrl(sessionId: string, fileExtension: string): Promise<PhotoUploadUrlResponse> {
  const { data } = await api.post<PhotoUploadUrlResponse>(`/api/public/sessions/${sessionId}/photo/upload-url`, { fileExtension });
  return data;
}

export async function confirmPhoto(sessionId: string, key: string): Promise<SessionSnapshot> {
  const { data } = await api.post<PhotoConfirmResponse>(`/api/public/sessions/${sessionId}/photo/confirm`, { key });
  // The API returns { success: true, data: { session: { ... } } }
  // Axios unwraps to { session: { ... } }
  return data.session;
}

export async function triggerGeneration(sessionId: string): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>(`/api/public/sessions/${sessionId}/generate`);
  return data;
}

export async function regeneratePage(sessionId: string, pageNumber: number): Promise<RegenerateResponse> {
  const { data } = await api.post<RegenerateResponse>(`/api/public/sessions/${sessionId}/pages/${pageNumber}/regenerate`);
  return data;
}
