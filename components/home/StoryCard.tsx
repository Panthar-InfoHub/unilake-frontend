"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PublicComicListItem } from "@/app/types/comic";
import { CoverType } from "@/app/types/comic";
import { useCountryStore } from "@/stores/useCountryStore";

interface StoryCardProps {
  comic: PublicComicListItem;
}

export default function StoryCard({ comic }: StoryCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const getCurrencySymbol = useCountryStore((state) => state.getCurrencySymbol);

  // Fallback if no images are present
  const images = comic.coverThumbnailUrls.length > 0 
    ? comic.coverThumbnailUrls 
    : ["/assets/home_page/bookCover1.png"]; // Default fallback image

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1500);
    } else {
      setCurrentImageIndex(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovered, images.length]);

  // Safely extract age value to display in format "AGE: X-Y"
  let ageLabel = comic.ageGroup?.replace("AGE_", "").replace("_", "-") || "ALL AGES";
  if (!ageLabel.includes("-")) ageLabel = ageLabel.toUpperCase(); // fallback formatting

  const category = comic.theme?.name || "General";
  const pages = comic.pageCount || 24;

  // Extract pricing info
  const pricing = comic.pricingRules.find(
    (p) => p.country.code === selectedCountry?.code && p.coverType === CoverType.SOFTCOVER
  );
  
  const basePrice = pricing ? parseFloat(pricing.price) : 0;
  const originalPrice = basePrice * 1.3;
  const currencySymbol = getCurrencySymbol();

  return (
    <div
      className="
        relative
        w-full
        max-w-[330px] sm:max-w-[355px] md:max-w-[380px]
        mx-auto
        aspect-[427/623]
        overflow-visible
        transition-all duration-300 hover:-translate-y-2
        group
      "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background SVG Frame (card.svg includes shadow & body) */}
      <Image
        src="/assets/card.svg"
        alt="Story Card Background"
        fill
        className="pointer-events-none select-none z-0"
        priority
      />

      {/* Book Cover Image */}
      <div
        className="absolute z-10 overflow-hidden shadow-[inset_0_4px_8px_rgba(0,0,0,0.35)] bg-slate-900/50"
        style={{
          left: "16%",
          top: "6.5%",
          width: "68%",
          height: "37.5%",
          borderRadius: "4px",
        }}
      >
        <Image
          src={images[currentImageIndex]}
          alt={comic.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="
            object-cover
            absolute inset-0
            transition-all duration-500 ease-out
          "
          priority
        />
        
        {/* Subtle book gloss */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/12 pointer-events-none z-10" />
      </div>

      {/* White Body Container */}
      <div
        className="
          absolute
          left-[13.5%]
          top-[48.5%]
          w-[73%]
          h-[48%]
          z-10
          flex flex-col
          gap-0
          pt-1
        "
      >
        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {/* Age Pill */}
          <span className="text-[8px] font-extrabold text-[#5C53C6] bg-[#EBE7FF] border border-[#D6CFFF]/50 rounded-full px-2 py-0.5 uppercase tracking-wide">
            AGE: {ageLabel}
          </span>

          {/* Category Pill */}
          <span className="text-[8px] font-extrabold text-[#1F8A60] bg-[#E3F8EE] border border-[#CCEFE2]/50 rounded-full px-2 py-0.5 uppercase tracking-wide">
            {category}
          </span>

          {/* Pages Pill */}
          <span className="text-[8px] font-extrabold text-[#B04C1C] bg-[#FFF0E6] border border-[#FFE1D1]/50 rounded-full px-2 py-0.5 uppercase tracking-wide">
            {pages} PAGES
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-extrabold text-[#1A1A1A] uppercase leading-snug tracking-normal line-clamp-1 mb-2">
          {comic.title}
        </h3>

        {/* Description */}
        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mb-3 h-[28px] overflow-hidden">
          {comic.description || "A personalized storybook adventure for your child."}
        </p>

        {/* Price Layout */}
        {pricing ? (
          <div className="flex flex-col gap-0.5 mb-3 h-[38px]">
            <span className="text-base font-extrabold text-gray-900 leading-none">
              {currencySymbol} {basePrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-400 line-through mt-0.5">
              {currencySymbol} {originalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-0.5 mb-3 h-[38px]">
             <span className="text-[10px] font-bold text-red-500 leading-tight">
               Not available for shipping in {selectedCountry?.name || "this country"}
             </span>
          </div>
        )}

        {/* Personalise Button */}
        <div className="flex justify-center w-full">
          <button
            onClick={() => router.push(`/comic/${comic.id}`)}
            disabled={!pricing}
            className={`
              w-[80%]
              bg-gradient-to-b from-[#3F3C95] to-[#2B2882]
              text-white
              text-[10px] font-extrabold
              uppercase tracking-wider
              py-2
              rounded-full
              border-b-[4px] border-[#C8942A]
              shadow-[0_4px_10px_rgba(63,60,149,0.3)]
              transition-all
              text-center
              ${
                !pricing
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : "hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] cursor-pointer"
              }
            `}
          >
            Personalise
          </button>
        </div>
      </div>
    </div>
  );
}