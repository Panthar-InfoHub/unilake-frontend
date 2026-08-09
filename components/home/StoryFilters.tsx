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
  color: string;
  borderColor: string;
  bgColor: string;
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
        color: "text-orange-500",
        borderColor: "border-orange-300",
        bgColor: "bg-orange-50",
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
        color: "text-purple-500",
        borderColor: "border-purple-300",
        bgColor: "bg-purple-50",
        options: [
          { label: "Boy", value: GenderTag.BOY },
          { label: "Girl", value: GenderTag.GIRL },
          { label: "Unisex", value: GenderTag.UNISEX },
        ],
      },
      {
        id: "themeId",
        label: "Theme",
        color: "text-teal-500",
        borderColor: "border-teal-300",
        bgColor: "bg-teal-50",
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
      className="flex items-center justify-center gap-4 sm:gap-6 py-8"
    >
      {filters.map((filter) => (
        <div key={filter.id} className="relative">
          {/* Pill Button */}
          <button
            onClick={() => toggleFilter(filter.id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full
              border-2 transition-all duration-300
              ${
                openFilter === filter.id || selected[filter.id]
                  ? `${filter.bgColor} ${filter.borderColor} shadow-sm`
                  : "bg-white border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md"
              }
            `}
          >
            <span
              className={`
                font-bold text-[15px] tracking-wide
                ${
                  openFilter === filter.id || selected[filter.id]
                    ? filter.color
                    : "text-gray-700"
                }
              `}
            >
              {filter.label}
            </span>
            <ChevronDown
              className={`
                w-4 h-4 transition-transform duration-300
                ${
                  openFilter === filter.id || selected[filter.id]
                    ? filter.color
                    : "text-gray-400"
                }
                ${openFilter === filter.id ? "rotate-180" : "rotate-0"}
              `}
            />
          </button>

          {/* Dropdown Menu */}
          {openFilter === filter.id && (
            <div className="absolute top-full mt-2 w-48 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1">
                {filter.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => selectOption(filter.id, option.value)}
                    className={`
                      w-full text-left px-4 py-2.5
                      text-sm font-medium
                      transition-colors duration-150
                      hover:${filter.bgColor} hover:${filter.color}
                      ${
                        selected[filter.id] === option.value
                          ? `${filter.bgColor} ${filter.color} font-bold`
                          : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
                {filter.id === "themeId" && themesLoading && (
                  <div className="flex justify-center p-2">
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
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
