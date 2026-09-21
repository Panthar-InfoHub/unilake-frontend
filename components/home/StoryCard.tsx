"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PublicComicListItem } from "@/app/types/comic";
import { CoverType } from "@/app/types/comic";
import { useCountryStore } from "@/stores/useCountryStore";
import { hankenGrotesk, poppins, protestStrike } from "@/app/fonts";
import { resolveMrp } from "@/lib/utils";

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
  
  // MRP is admin-entered per country and cover type. It used to be faked here
  // as price * 1.3; it is now a real column on the pricing rule.
  const { price: basePrice, mrp, showMrp } = pricing
    ? resolveMrp(pricing)
    : { price: 0, mrp: NaN, showMrp: false };
  const currencySymbol = getCurrencySymbol();

  return (
    <div
      className={`
        relative
        w-full
        max-w-[330px] sm:max-w-[355px] md:max-w-[380px]
        mx-auto
        aspect-[427/623]
        overflow-visible
        transition-all duration-300 hover:-translate-y-2
        group
        ${hankenGrotesk.className}
      `}
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
          top-[46%]
          w-[73%]
          h-[52%]
          z-10
          flex flex-col
          gap-0
        "
      >
        {/* Tags — one line, never wrapped.
            `flex-nowrap` because a wrapped second row would add height here and
            push everything below it down, which is the same class of bug the
            description's fixed height exists to prevent.
            Age and pages are short and fixed, so they never give way. The theme
            name is admin-entered and unbounded, so it is the one that truncates:
            `min-w-0` is what actually lets it shrink — a flex item will not go
            below its content width without it, and `truncate` alone would do
            nothing here. */}
        <div className="flex items-center gap-1.5 flex-nowrap mb-1 md:mb-2">
          {/* Age Pill */}
          <span className="shrink-0 whitespace-nowrap text-[8px] font-extrabold text-[#5C53C6] bg-[#EBE7FF] border border-[#D6CFFF]/50 rounded-full px-2 py-0.5 uppercase tracking-wide">
            AGE: {ageLabel}
          </span>

          {/* Category Pill — the only one allowed to shrink. */}
          <span
            title={category}
            className="min-w-0 truncate text-[8px] font-extrabold text-[#1F8A60] bg-[#E3F8EE] border border-[#CCEFE2]/50 rounded-full px-2 py-0.5 uppercase tracking-wide"
          >
            {category}
          </span>

          {/* Pages Pill */}
          <span className="shrink-0 whitespace-nowrap text-[8px] font-extrabold text-[#B04C1C] bg-[#FFF0E6] border border-[#FFE1D1]/50 rounded-full px-2 py-0.5 uppercase tracking-wide">
            {pages} PAGES
          </span>
        </div>

        {/* Title */}
        <h3 className={`${hankenGrotesk.className} text-base sm:text-lg md:text-[24px] font-bold text-[#000000] uppercase leading-tight md:leading-[48px] tracking-normal line-clamp-1 mb-1 md:mb-2`}>
          {comic.title}
        </h3>

        {/* Description — exactly one line, always.
            `line-clamp-1` is only a ceiling: it cuts a long description at one
            line with an ellipsis, but a short one would still collapse to
            whatever height it needs, pulling the price and button up with it and
            leaving cards misaligned across the grid. The min-height supplies the
            floor, so the block is a fixed size whether the description is long,
            short, or missing entirely.
            Same reasoning as the fixed-height price wrapper below. The px values
            are one rendered line at each breakpoint (10px/12px at leading-snug,
            then the explicit 18px), rounded up. */}
        <p className={`${poppins.className} text-[10px] sm:text-xs md:text-[14px] font-normal text-[#000000]/[0.74] leading-snug md:leading-[18px] line-clamp-1 min-h-[14px] sm:min-h-[17px] md:min-h-[18px] mb-1 md:mb-3 overflow-hidden`}>
          {comic.description || "A personalized storybook adventure for your child."}
        </p>

        {/* Price Layout */}
        {pricing ? (
          <div className="flex flex-col gap-0 md:gap-0.5 mb-2 md:mb-3 h-[36px] md:h-[50px]">
            <span className={`${protestStrike.className} text-[18px] sm:text-[20px] md:text-[24px] font-normal text-[#000000] leading-none md:leading-[16px] uppercase`}>
              {currencySymbol} {basePrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            {/* Hidden when the comic has no MRP set, or is sold at full price.
                The wrapper keeps its fixed height either way, so a card without
                a discount doesn't shift the grid. */}
            {showMrp && (
              <span className={`${protestStrike.className} text-[12px] sm:text-[14px] md:text-[18px] text-[#6B7280] line-through uppercase mt-0.5`}>
                {currencySymbol} {mrp.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-0 md:gap-0.5 mb-2 md:mb-3 h-[36px] md:h-[50px]">
             <span className="text-[9px] md:text-[10px] font-bold text-red-500 leading-tight">
               Not available for shipping in {selectedCountry?.name || "this country"}
             </span>
          </div>
        )}

        {/* Personalise Button.
            ⚠️ Do NOT add `mt-auto` here. It looks like the right way to stop the
            button moving, but this flex container is `top-[46%] h-[52%]` — it
            runs to 98% of the card, while the shield shape in card.svg tapers
            and ends well above that. Pushing the button to the container's
            bottom drops it into the empty space BELOW the visible card.
            The button does not need pinning: everything above it is already a
            fixed height — the tag row cannot wrap, the title and description are
            both clamped to one line with a min-height, and the price wrapper has
            an explicit height in both of its branches. So the button lands at
            the same place on every card by simply flowing after them. */}
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