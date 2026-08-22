"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Edit2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ComicDetail, GenderTag, AgeGroup } from "@/app/types/comic";
import { useUpdateComic } from "@/hooks/useComics";
import { ComicDetailsFields } from "@/components/admin/comic/create/ComicDetailsFields";

// Slightly different schema for update - freePreviewPages must be > 0 (not >= 0) due to API inconsistency
const comicUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  genderTag: z.nativeEnum(GenderTag, { message: "Gender is required" }),
  pageCount: z.coerce.number().int().positive("Page count must be greater than 0"),
  freePreviewPages: z.coerce.number().int().positive("Preview pages must be > 0 on update"),
  description: z.string().optional().or(z.literal("")),
  themeId: z.string().uuid("Invalid theme ID").optional().or(z.literal("")),
  ageGroup: z.nativeEnum(AgeGroup).optional(),
  isBestseller: z.boolean().default(false),
}).refine(data => data.freePreviewPages < data.pageCount, {
  message: "Preview pages must be strictly less than total pages",
  path: ["freePreviewPages"],
});

type ComicUpdateFormValues = z.infer<typeof comicUpdateSchema>;

interface ComicInfoEditorProps {
  comic: ComicDetail;
}

export function ComicInfoEditor({ comic }: ComicInfoEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutateAsync: updateComic, isPending } = useUpdateComic();

  const form = useForm<ComicUpdateFormValues>({
    resolver: zodResolver(comicUpdateSchema)as any,
    defaultValues: {
      title: comic.title,
      genderTag: comic.genderTag,
      pageCount: comic.pageCount,
      freePreviewPages: comic.freePreviewPages,
      description: comic.description || "",
      themeId: comic.themeId ?? undefined,
      ageGroup: comic.ageGroup ?? undefined,
      isBestseller: comic.isBestseller,
    },
  });

  const onSubmit = async (data: ComicUpdateFormValues) => {
    const flaggedPages = comic.pages.filter((p) => p.isPreviewPage).length;

    // The limit can't drop below the number of pages already flagged — those
    // have to be un-flagged on the Pages tab first. Raising it stays allowed,
    // since the limit must go up before more pages can be flagged.
    if (data.freePreviewPages < flaggedPages) {
      toast.error(
        `${flaggedPages} page(s) are marked as preview pages. Turn off ${
          flaggedPages - data.freePreviewPages
        } of them on the Pages tab before lowering this number.`
      );
      return;
    }

    try {
      await updateComic({
        id: comic.id,
        data: {
          title: data.title,
          genderTag: data.genderTag,
          pageCount: data.pageCount,
          freePreviewPages: data.freePreviewPages,
          description: data.description?.trim() || undefined,
          isBestseller: data.isBestseller,
          themeId: data.themeId,
          ageGroup: data.ageGroup,
        },
      });
      toast.success("Comic details updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update comic details");
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Comic Details</h2>
            <p className="text-sm text-neutral-500">Basic information about the comic.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="rounded-xl border-neutral-300 font-semibold"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Title</p>
            <p className="text-sm font-medium text-neutral-900">{comic.title}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Gender</p>
            <p className="text-sm font-medium text-neutral-900">{comic.genderTag}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Age Group</p>
            <p className="text-sm font-medium text-neutral-900">
              {comic.ageGroup ? comic.ageGroup.replace("AGE_", "").replace("_", "-") + " yrs" : "None"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Total Pages</p>
            <p className="text-sm font-medium text-neutral-900">{comic.pageCount}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Preview Pages</p>
            <p className="text-sm font-medium text-neutral-900">{comic.freePreviewPages}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Theme</p>
            <p className="text-sm font-medium text-neutral-900">{comic.theme?.name || "None"}</p>
          </div>
          <div className="sm:col-span-2 md:col-span-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Description</p>
            <p className="text-sm font-medium text-neutral-900 bg-neutral-50 p-4 rounded-xl border border-neutral-100 whitespace-pre-wrap">
              {comic.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Edit Details</h2>
          <p className="text-sm text-neutral-500">Update basic information.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ComicDetailsFields form={form as any} />
          
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleCancel}
              className="rounded-xl border-neutral-300 font-semibold h-11 px-5"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-11 px-8 shadow-sm"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
