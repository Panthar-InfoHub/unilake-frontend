import { useQuery } from "@tanstack/react-query";
import { fetchPublicComics, fetchPublicComic } from "@/app/actions/comic";
import { fetchThemes } from "@/app/actions/theme";

export function usePublicComics(filters?: {
  gender?: string;
  ageGroup?: string;
  themeId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["public-comics", filters],
    queryFn: () => fetchPublicComics(filters),
  });
}

export function usePublicComic(comicId: string) {
  return useQuery({
    queryKey: ["public-comic", comicId],
    queryFn: () => fetchPublicComic(comicId),
    enabled: !!comicId,
  });
}

export function usePublicThemes() {
  return useQuery({
    queryKey: ["public-themes"],
    queryFn: () => fetchThemes(),
  });
}

import { fetchPublicCountries } from "@/app/actions/country";

export function usePublicCountries() {
  return useQuery({
    queryKey: ["public-countries"],
    queryFn: fetchPublicCountries,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
