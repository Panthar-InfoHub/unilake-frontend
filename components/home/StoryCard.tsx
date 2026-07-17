"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { Story } from "@/data/storyData";

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const defaultImage = story.images[0];
  const hoverImage = story.images[1] ?? story.images[0];

  const defaultAvatar = story.avatarSrc ?? "/assets/home_page/boyHeroImg.png";
  const hoverAvatar =
    story.avatarHoverSrc ?? "/assets/home_page/DragonImg.png";

  // Safely extract age value to display in format "AGE: X-Y"
  const ageLabel = story.ageRange.toUpperCase().startsWith("AGE")
    ? `AGE: ${story.ageRange.toUpperCase().replace("AGE", "").trim()}`
    : story.ageRange;

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
    >
      {/* Background SVG Frame (card.svg includes shadow & body) */}
      <Image
        src="/assets/card.svg"
        alt="Story Card Background"
        fill
        className="pointer-events-none select-none z-0"
        priority
      />

      {/* Book Cover Image — crossfade on group hover */}
      <div
        className="absolute z-10 overflow-hidden shadow-[inset_0_4px_8px_rgba(0,0,0,0.35)] bg-slate-900/50"
        style={{
          left: "14.5%",
          top: "7.2%",
          width: "71%",
          height: "38.5%",
          borderRadius: "4px",
        }}
      >
        {/* Default image — visible, fades out + scales up on hover */}
        <Image
          src={defaultImage.src}
          alt={defaultImage.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="
            object-cover
            absolute inset-0
            transition-all duration-500 ease-out
            opacity-100 scale-100
            group-hover:opacity-0 group-hover:scale-105
          "
          priority
        />

        {/* Hover image — hidden, fades in + scales to normal on hover */}
        <Image
          src={hoverImage.src}
          alt={hoverImage.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="
            object-cover
            absolute inset-0
            transition-all duration-500 ease-out
            opacity-0 scale-95
            group-hover:opacity-100 group-hover:scale-100
          "
          loading="eager"
        />

        {/* Subtle book gloss */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/12 pointer-events-none z-10" />
      </div>

      {/* Heart Icon (Top-Right of chalkboard area) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsLiked(!isLiked);
        }}
        className="
          absolute
          top-[9.5%]
          right-[17%]
          w-7
          h-7
          flex
          items-center
          justify-center
          bg-white/95
          border border-gray-100
          rounded-full
          shadow-md
          hover:scale-110
          transition-transform
          duration-200
          cursor-pointer
          z-20
        "
      >
        <Heart
          size={12}
          className={
            isLiked
              ? "fill-red-500 text-red-500"
              : "text-[#3F3C95]"
          }
        />
      </button>

      {/* Circular Kid Avatar — crossfade on group hover */}
      <div
        className="
          absolute
          w-[16%]
          aspect-square
          rounded-full
          border-[3px] border-white
          shadow-[0_4px_8px_rgba(0,0,0,0.15)]
          overflow-hidden
          bg-white
          z-20
          transition-transform duration-300 group-hover:scale-105
        "
        style={{
          left: "12%",
          top: "39%",
        }}
      >
        {/* Default avatar — fades out on hover */}
        <Image
          src={defaultAvatar}
          alt="Child Avatar"
          fill
          sizes="56px"
          className="
            object-cover object-top scale-125 translate-y-[2px]
            absolute inset-0
            transition-all duration-500 ease-out
            opacity-100
            group-hover:opacity-0
          "
          priority
        />

        {/* Hover avatar — fades in on hover */}
        <Image
          src={hoverAvatar}
          alt="Character Avatar"
          fill
          sizes="56px"
          className="
            object-cover object-top scale-125 translate-y-[2px]
            absolute inset-0
            transition-all duration-500 ease-out
            opacity-0
            group-hover:opacity-100
          "
          loading="eager"
        />
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
            {ageLabel}
          </span>

          {/* Category Pill */}
          <span className="text-[8px] font-extrabold text-[#1F8A60] bg-[#E3F8EE] border border-[#CCEFE2]/50 rounded-full px-2 py-0.5 uppercase tracking-wide">
            {story.category}
          </span>

          {/* Pages Pill */}
          <span className="text-[8px] font-extrabold text-[#B04C1C] bg-[#FFF0E6] border border-[#FFE1D1]/50 rounded-full px-2 py-0.5 uppercase tracking-wide">
            {story.pages} PAGES
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-extrabold text-[#1A1A1A] uppercase leading-snug tracking-normal line-clamp-1 mb-2">
          {story.title}
        </h3>

        {/* Description */}
        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {story.description}
        </p>

        {/* Price Layout */}
        <div className="flex flex-col gap-0.5 mb-3">
          <span className="text-base font-extrabold text-gray-900 leading-none">
            ₹ {story.price.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-gray-400 line-through mt-0.5">
            ₹ {story.originalPrice.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Personalise Button */}
        <div className="flex justify-center w-full">
          <button
            className="
              w-[80%]
              bg-gradient-to-b from-[#3F3C95] to-[#2B2882]
              text-white
              text-[10px] font-extrabold
              uppercase tracking-wider
              py-2
              rounded-full
              border-b-[4px] border-[#C8942A]
              shadow-[0_4px_10px_rgba(63,60,149,0.3)]
              hover:brightness-110
              active:translate-y-[2px] active:border-b-[2px]
              transition-all
              cursor-pointer
              text-center
            "
          >
            Personalise
          </button>
        </div>
      </div>
    </div>
  );
}