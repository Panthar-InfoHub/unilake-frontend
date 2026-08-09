"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ComicThumbnailCarouselProps {
  images: string[];
}

export default function ComicThumbnailCarousel({ images }: ComicThumbnailCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback if no images
  const displayImages = images.length > 0 ? images : ["/assets/home_page/bookCover1.png"];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[480px]">
      {/* Carousel Container */}
      <div className="relative w-full aspect-[427/310] flex items-center justify-center mb-6 px-4">
        
        {/* Book Cover Container with slight tilt */}
        <div className="relative w-full h-full max-w-[380px] -rotate-2 hover:rotate-0 transition-transform duration-500 origin-center">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.15)] bg-slate-100">
            <Image
              src={displayImages[currentIndex]}
              alt={`Cover ${currentIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              priority
            />
          </div>
        </div>

        {/* Previous Button */}
        {displayImages.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-[#FFD54A] border-[3px] border-[#3F3C95] rounded-full flex items-center justify-center text-[#3F3C95] shadow-lg hover:scale-110 transition-transform z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
        )}

        {/* Next Button */}
        {displayImages.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-[#FFD54A] border-[3px] border-[#3F3C95] rounded-full flex items-center justify-center text-[#3F3C95] shadow-lg hover:scale-110 transition-transform z-10"
            aria-label="Next image"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Dots Indicator */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-2">
          {displayImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? "w-8 h-2 bg-[#914A8C]"
                  : "w-2 h-2 bg-[#914A8C]/30 hover:bg-[#914A8C]/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
