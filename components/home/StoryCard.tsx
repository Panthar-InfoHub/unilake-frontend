"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { Story } from "@/data/storyData";

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentImage = story.images[activeImageIndex];


  {/* Images changes when hover into it */ }

  useEffect(() => {
    if (!isHovered) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setActiveImageIndex(0);
      return;
    }

    intervalRef.current = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % story.images.length);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, story.images.length]);

  // Safely extract age value to display in format "AGE: X-Y"
  const ageLabel = story.ageRange.toUpperCase().startsWith("AGE")
    ? `AGE: ${story.ageRange.toUpperCase().replace("AGE", "").trim()}`
    : story.ageRange;

  return (
    <div
      className="
        relative
        flex flex-col
        max-w-[320px]
        mx-auto
        w-full
        overflow-visible
        transition-transform duration-300 hover:-translate-y-1.5
        pb-8
      "
    >
      {/* Chalkboard / Wooden Frame Section */}
      <div className="relative p-2.5 z-0">
        {/* Chalkboard frame wrapper */}
        <div
          className="
    relative
    rounded-2xl
    border-[10px] border-[#9E6E43]
    bg-[#1E2325]
    shadow-[inset_0_4px_10px_rgba(0,0,0,0.5),0_6px_12px_rgba(0,0,0,0.15)]
    aspect-[4/3]
    w-full
    flex items-center justify-center
    p-3
    overflow-hidden
  "
          onMouseEnter={() => {
            setIsHovered(true);
            if (story.images.length > 1) {
              setActiveImageIndex(1);
            }
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
        >
          {/* Grainy chalkboard overlay */}
          <div className="absolute inset-0 bg-black/15 mix-blend-overlay pointer-events-none" />

          {/* Book Cover Image inside board */}
          <div className="relative w-full h-[90%] rounded-md overflow-hidden shadow-md">
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw"
              className="object-cover transition-all duration-300 ease-in-out"
            />
            {/* Subtle book gloss */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
          </div>

          {/* Heart Icon (Top-Right) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="
              absolute
              top-3.5
              right-3.5
              w-8
              h-8
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
              size={14}
              className={
                isLiked
                  ? "fill-red-500 text-red-500"
                  : "text-[#3F3C95]"
              }
            />
          </button>

          {/* Image dots (Bottom-Right of chalkboard area) */}
          <div className="absolute bottom-4 right-4 flex gap-1 z-20">
            {story.images.map((img, idx) => (
              <button
                key={img.id}
                onMouseEnter={() => setActiveImageIndex(idx)}
                className={`
                  w-1.5
                  h-1.5
                  rounded-full
                  transition-all
                  duration-200
                  cursor-pointer
                  ${idx === activeImageIndex
                    ? "bg-white scale-125 shadow-md"
                    : "bg-white/50"
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Chalk Tray & Duster (Bottom-Right Border) */}
        <div className="absolute bottom-[2px] right-8 translate-y-1/2 z-20 flex items-end">
          {/* Wood Tray */}
          <div className="relative bg-[#7A4B24] border-t border-[#9E6E43] h-2.5 px-3 rounded-sm flex items-center gap-1 shadow-md">
            {/* Chalk pieces */}
            <div className="w-3 h-1 bg-white rounded-sm -rotate-12"></div>
            <div className="w-3 h-1 bg-pink-300 rounded-sm rotate-6"></div>
            <div className="w-3 h-1 bg-blue-300 rounded-sm -rotate-6"></div>
            {/* Duster */}
            <div className="w-4 h-1.5 bg-[#4A3B32] rounded-sm flex flex-col border-b border-[#5C341A]">
              <div className="h-0.5 w-full bg-gray-400 rounded-t-sm"></div>
            </div>
          </div>
        </div>

        {/* Circular Kid Avatar (Bottom-Left Overlapping Frame) */}
        <div
          className="
            absolute
            bottom-[-2px]
            left-6
            w-14
            h-14
            rounded-full
            border-[3px] border-white
            shadow-md
            overflow-hidden
            bg-white
            z-20
          "
        >
          <Image
            src="/assets/home_page/boyHeroImg.png"
            alt="Child Avatar"
            fill
            sizes="56px"
            className="object-cover object-top scale-125 translate-y-[2px]"
          />
        </div>
      </div>

      {/* Page-Curl Shadows (Behind White Body Curve) */}
      
      <div className="absolute bottom-6 left-6 w-14 h-8 bg-black/15 rounded-full blur-[6px] -rotate-12 z-0 pointer-events-none"></div>
      <div className="absolute bottom-6 right-6 w-14 h-8 bg-black/15 rounded-full blur-[6px] rotate-12 z-0 pointer-events-none"></div>

      {/* White Body Container with Curved Bottom */}
      <div
        className="
          relative
          flex flex-col
          flex-1
          filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]
          z-10
          -mt-1
        "
      >
        {/* Main Content Div (flat top, curved bottom shape extends via SVG below) */}
        <div className="bg-white px-5 pt-4 pb-2 flex flex-col gap-3 flex-1 relative">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {/* Age Pill */}
            <span className="text-[9px] font-bold text-[#5B3AB6] bg-[#E5D9FC] border border-[#D5C2FA] rounded-full px-2.5 py-0.5 uppercase tracking-wide">
              {ageLabel}
            </span>

            {/* Category Pill */}
            <span className="text-[9px] font-bold text-[#1E7D56] bg-[#E2F7ED] border border-[#C5EFE0] rounded-full px-2.5 py-0.5 uppercase tracking-wide">
              {story.category}
            </span>

            {/* Pages Pill */}
            <span className="text-[9px] font-bold text-[#A7440E] bg-[#FDE7D9] border border-[#FCD2B6] rounded-full px-2.5 py-0.5 uppercase tracking-wide">
              {story.pages} PAGES
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-extrabold text-gray-900 uppercase leading-tight tracking-wide">
            {story.title}
          </h3>

          {/* Description */}
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
            {story.description}
          </p>

          {/* Price Layout */}
          <div className="flex flex-col gap-0.5 mt-auto">
            <span className="text-lg font-extrabold text-gray-900">
              ₹ {story.price.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-400 line-through">
              ₹ {story.originalPrice.toLocaleString("en-IN")}
            </span>
          </div>

          {/* 3D Interactive Personalise Button */}
          <div className="mt-2 w-full z-20">
            <button
              className="
                w-full
                bg-gradient-to-r from-[#3F3C95] to-[#2B2882]
                text-white
                text-xs font-bold
                uppercase tracking-wider
                py-2.5
                rounded-full
                border-b-[4px] border-[#C8942A]
                shadow-md
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

        {/* SVG Curved Bottom Segment */}
        <div className="relative w-full h-8 bg-transparent pointer-events-none -mt-[1px]">
          <svg
            viewBox="0 0 320 30"
            className="absolute top-0 left-0 w-full h-full fill-white"
            preserveAspectRatio="none"
          >
            <path d="M 0 0 L 0 8 Q 160 25, 320 8 L 320 0 Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}