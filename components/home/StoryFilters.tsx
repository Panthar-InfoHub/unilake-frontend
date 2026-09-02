"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { usePublicThemes } from "@/hooks/usePublicComics";
import { AgeGroup, GenderTag } from "@/app/types/comic";

interface FilterOption {
  label: string;
  value: string;
}

interface Filter {
  id: string;
  label: string;
  options: FilterOption[];
}

interface StoryFiltersProps {
  selected: Record<string, string>;
  onSelect: (filterId: string, value: string) => void;
}

export default function StoryFilters({ selected, onSelect }: StoryFiltersProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: themes, isLoading: themesLoading } = usePublicThemes();

  const filters = useMemo<Filter[]>(() => {
    return [
      {
        id: "ageGroup",
        label: "Age",
        options: [
          { label: "0-2 Years", value: AgeGroup.AGE_0_2 },
          { label: "3-5 Years", value: AgeGroup.AGE_3_5 },
          { label: "6-8 Years", value: AgeGroup.AGE_6_8 },
          { label: "9-12 Years", value: AgeGroup.AGE_9_12 },
        ],
      },
      {
        id: "gender",
        label: "Gender",
        options: [
          { label: "Boy", value: GenderTag.BOY },
          { label: "Girl", value: GenderTag.GIRL },
          { label: "Unisex", value: GenderTag.UNISEX },
        ],
      },
      {
        id: "themeId",
        label: "Theme",
        options: themes ? themes.map((t) => ({ label: t.name, value: t.id })) : [],
      },
    ];
  }, [themes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFilter = (id: string) => {
    setOpenFilter((prev) => (prev === id ? null : id));
  };

  const selectOption = (filterId: string, value: string) => {
    onSelect(filterId, value);
    setOpenFilter(null);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 py-8"
    >
      {filters.map((filter) => (
        <div key={filter.id} className="relative">
          {/* Pill Button */}
          <button
            onClick={() => toggleFilter(filter.id)}
            className={`
              flex items-center gap-4 px-5 py-2 rounded-full
              border-[2.5px] border-[#D6CFFF] bg-white
              transition-all duration-300
              ${openFilter === filter.id || selected[filter.id]
                ? "shadow-sm bg-[#F9F8FF]"
                : "shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md hover:bg-[#F9F8FF]"
              }
            `}
          >
            <span className="font-extrabold text-[15px] md:text-base text-[#7C5DFA] tracking-wide">
              {filter.label}
            </span>
            <ChevronDown
              className={`
                w-4 h-4 text-[#F06B30] transition-transform duration-300
                ${openFilter === filter.id ? "rotate-180" : "rotate-0"}
              `}
              strokeWidth={3}
            />
          </button>

          {/* Dropdown Menu */}
          {openFilter === filter.id && (
            <div className="absolute top-full mt-2 w-48 rounded-2xl bg-white shadow-xl border border-[#D6CFFF] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1">
                {filter.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => selectOption(filter.id, option.value)}
                    className={`
                      w-full text-left px-4 py-2.5
                      text-sm font-medium
                      transition-colors duration-150
                      hover:bg-[#F9F8FF] hover:text-[#7C5DFA]
                      ${selected[filter.id] === option.value
                        ? "bg-[#F9F8FF] text-[#7C5DFA] font-bold"
                        : "text-gray-600"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
                {filter.id === "themeId" && themesLoading && (
                  <div className="flex justify-center p-2">
                    <Loader2 className="w-4 h-4 text-[#7C5DFA] animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
