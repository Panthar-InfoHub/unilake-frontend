import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPages, createPage, updatePage, deletePage, reorderPages } from "@/app/actions/page";
import type { Page } from "@/app/types/comic";

export function usePages(comicId: string) {
  return useQuery({
    queryKey: ["comic", comicId, "pages"],
    queryFn: () => fetchPages(comicId),
    enabled: !!comicId,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comicId, data }: { comicId: string; data: Partial<Page> & { pageNumber: number } }) =>
      createPage(comicId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] }); // Update page count in summary
      queryClient.invalidateQueries({ queryKey: ["comics"] }); // Update list
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, data, comicId }: { pageId: string; data: Partial<Page>; comicId: string }) =>
      updatePage(pageId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, comicId }: { pageId: string; comicId: string }) => deletePage(pageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}

export function useReorderPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comicId, orderedPageIds }: { comicId: string; orderedPageIds: string[] }) =>
      reorderPages(comicId, orderedPageIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}
