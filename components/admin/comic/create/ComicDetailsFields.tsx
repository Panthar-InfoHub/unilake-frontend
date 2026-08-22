import { UseFormReturn } from "react-hook-form";
import { ComicCreateFormValues } from "./comicCreateSchema";
import { GenderTag, AgeGroup } from "@/app/types/comic";
import { useThemes } from "@/hooks/useThemes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

interface ComicDetailsFieldsProps {
  form: UseFormReturn<ComicCreateFormValues>;
}

export function ComicDetailsFields({ form }: ComicDetailsFieldsProps) {
  const { data: themes, isLoading: isLoadingThemes } = useThemes();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-neutral-900 font-semibold">Comic Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter comic title" {...field} className="h-11 rounded-xl bg-white border-neutral-200" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="genderTag"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-semibold">Gender *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-neutral-200">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  <SelectItem value={GenderTag.BOY}>Boy</SelectItem>
                  <SelectItem value={GenderTag.GIRL}>Girl</SelectItem>
                  <SelectItem value={GenderTag.UNISEX}>Unisex</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageGroup"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-semibold">Age Group *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-neutral-200">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  <SelectItem value={AgeGroup.AGE_0_2}>0-2 Years</SelectItem>
                  <SelectItem value={AgeGroup.AGE_3_5}>3-5 Years</SelectItem>
                  <SelectItem value={AgeGroup.AGE_6_8}>6-8 Years</SelectItem>
                  <SelectItem value={AgeGroup.AGE_9_12}>9-12 Years</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pageCount"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-semibold">Total Page Count *</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} className="h-11 rounded-xl bg-white border-neutral-200" />
              </FormControl>
              <FormDescription className="text-xs">Physical pages in the printed book.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="freePreviewPages"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-semibold">Free Preview Pages *</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} className="h-11 rounded-xl bg-white border-neutral-200" />
              </FormControl>
              <FormDescription className="text-xs">Must be less than total page count.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="themeId"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-neutral-900 font-semibold">Theme *</FormLabel>
              {isLoadingThemes ? (
                <Skeleton className="h-11 w-full rounded-xl bg-neutral-100" />
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-neutral-200">
                      <SelectValue placeholder="Select a theme">
                        {field.value ? themes?.find((t) => t.id === field.value)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {themes?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-neutral-900 font-semibold">Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Comic synopsis or details..." 
                  {...field} 
                  className="min-h-[100px] rounded-xl bg-white border-neutral-200 resize-y" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isBestseller"
          render={({ field }: { field: any }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 p-4 bg-white md:col-span-2">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-semibold text-neutral-900">Bestseller Badge</FormLabel>
                <FormDescription className="text-xs text-neutral-500">
                  Highlight this comic as a bestseller on the storefront.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
