import { z } from "zod";
import { GenderTag, AgeGroup } from "@/app/types/comic";

export const comicCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  genderTag: z.nativeEnum(GenderTag, { message: "Gender is required" }),
  pageCount: z.coerce.number().int().positive("Page count must be greater than 0"),
  freePreviewPages: z.coerce.number().int().min(0, "Cannot be negative"),
  description: z.string().optional().or(z.literal("")),
  themeId: z.string().uuid({ message: "Theme is required" }),
  ageGroup: z.nativeEnum(AgeGroup, { message: "Age group is required" }),
  isBestseller: z.boolean().default(false),
}).refine(data => data.freePreviewPages < data.pageCount, {
  message: "Preview pages must be strictly less than total pages",
  path: ["freePreviewPages"],
});

export type ComicCreateFormValues = z.infer<typeof comicCreateSchema>;
