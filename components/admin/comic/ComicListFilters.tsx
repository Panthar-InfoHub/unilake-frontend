"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GenderTag, AgeGroup } from "@/app/types/comic";
import { useThemes } from "@/hooks/useThemes";

interface ComicListFiltersProps {
  onFiltersChange: (filters: { search?: string; gender?: string; ageGroup?: string; themeId?: string }) => void;
}

export function ComicListFilters({ onFiltersChange }: ComicListFiltersProps) {
  const { data: themes } = useThemes();
  
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<string>("ALL");
  const [ageGroup, setAgeGroup] = useState<string>("ALL");
  const [themeId, setThemeId] = useState<string>("ALL");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange({
        search: search || undefined,
        gender: gender === "ALL" ? undefined : gender,
        ageGroup: ageGroup === "ALL" ? undefined : ageGroup,
        themeId: themeId === "ALL" ? undefined : themeId,
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [search, gender, ageGroup, themeId, onFiltersChange]);

  const clearFilters = () => {
    setSearch("");
    setGender("ALL");
    setAgeGroup("ALL");
    setThemeId("ALL");
  };

  const hasActiveFilters = search || gender !== "ALL" || ageGroup !== "ALL" || themeId !== "ALL";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-[#914A8C]/15 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search comics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-neutral-200 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <Select value={gender} onValueChange={(val) => setGender(val || "ALL")}>
        <SelectTrigger className="w-full sm:w-[130px] h-10 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="ALL">All Genders</SelectItem>
          <SelectItem value={GenderTag.BOY}>Boy</SelectItem>
          <SelectItem value={GenderTag.GIRL}>Girl</SelectItem>
          <SelectItem value={GenderTag.UNISEX}>Unisex</SelectItem>
        </SelectContent>
      </Select>

      <Select value={ageGroup} onValueChange={(val) => setAgeGroup(val || "ALL")}>
        <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Age Group" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="ALL">All Ages</SelectItem>
          <SelectItem value={AgeGroup.AGE_0_2}>0-2 Years</SelectItem>
          <SelectItem value={AgeGroup.AGE_3_5}>3-5 Years</SelectItem>
          <SelectItem value={AgeGroup.AGE_6_8}>6-8 Years</SelectItem>
          <SelectItem value={AgeGroup.AGE_9_12}>9-12 Years</SelectItem>
        </SelectContent>
      </Select>

      <Select value={themeId} onValueChange={(val) => setThemeId(val || "ALL")}>
        <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="ALL">All Themes</SelectItem>
          {themes?.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="h-10 px-3 text-neutral-500 hover:text-neutral-900 rounded-xl"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
