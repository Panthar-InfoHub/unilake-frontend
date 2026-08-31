"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import StoryFilters from "@/components/home/StoryFilters";
import StoryCard from "@/components/home/StoryCard";
import { usePublicComics } from "@/hooks/usePublicComics";
import { Loader2 } from "lucide-react";
import { HowItWorks } from "@/app/types/howItWorks";

interface ChooseStoryProps {
  howItWorks: HowItWorks | null;
}

export default function ChooseStory({ howItWorks }: ChooseStoryProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (filterId: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: prev[filterId] === value ? "" : value,
    }));
  };

  const { data: comics, isLoading, error } = usePublicComics({
    ageGroup: selectedFilters.ageGroup,
    gender: selectedFilters.gender,
    themeId: selectedFilters.themeId,
  });

  return (
    <>
      {/* ===== Purple Wave Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/*
          Single SVG — flared/curves at both ends to match the reference image.
          Path uses cubic beziers for smooth organic S-curve transitions.
        */}
        <svg
          viewBox="0 0 1728 311"
          className="w-full block h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#914A8C"
            d="M66.9068 29.469L-1 0V297L60.6428 263.852C89.7598 248.195 122.304 240 155.364 240H278.89H416.829H535.5H698.224H836.5H1016.5H1151H1331.5H1500.38C1574.97 240 1648.08 260.856 1711.44 300.213L1728 310.5V0L1650.63 31.3555C1626.77 41.0275 1601.26 46 1575.51 46H1331.5H1151H1016.5H836.5H698.224H535.5H416.829H278.89H146.525C119.134 46 92.0343 40.3734 66.9068 29.469Z"
          />
        </svg>

        {/* Text overlay — centered vertically over the SVG */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto w-full px-8 pl-12 sm:pl-28 md:pl-40 lg:pl-52 xl:pl-[280px]">
            <h2
              className={`
                ${chauPhilomeneOne.className}
                text-white
                uppercase
                text-2xl
                sm:text-3xl
                md:text-4xl
                lg:text-5xl
                z-30
                relative
              `}
            >
              Choose Your Story
            </h2>
          </div>
        </div>

        {/* Dragon */}
        <Image
          src="/assets/home_page/DragonImg.png"
          alt="Dragon"
          width={680}
          height={425}
          priority
          className="
            absolute
            right-4
            sm:right-8
            md:right-16
            lg:right-32
            xl:right-48

            bottom-[-10px]
            sm:bottom-[-15px]
            md:bottom-[-20px]
            lg:bottom-[-25px]
            xl:bottom-[-30px]

            w-[180px]
            sm:w-[260px]
            md:w-[340px]
            lg:w-[420px]
            xl:w-[480px]

            h-auto
            object-contain
            pointer-events-none
            select-none
            z-20
          "
        />
      </div>

      {/* ===== Filters + Cards Grid ===== */}
      <section className="bg-[#F8E7D2]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Filter Pills */}
          <StoryFilters
            selected={selectedFilters}
            onSelect={handleFilterChange}
          />

          {/* Cards Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#914B8C] animate-spin mb-4" />
              <p className="text-[#555555] font-medium">Loading stories...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-500 font-medium">Failed to load stories. Please try again.</p>
            </div>
          ) : comics && comics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-16">
              {comics.map((comic) => (
                <StoryCard key={comic.id} comic={comic} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[#555555] font-medium text-lg">No stories found matching your criteria.</p>
              <button
                onClick={() => setSelectedFilters({})}
                className="mt-4 px-6 py-2 bg-white border border-[#914B8C] text-[#914B8C] rounded-full hover:bg-[#FDF9F3] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== "How It Works" Section ===== */}
      {howItWorks && (
        <>
          <div className="relative w-full overflow-visible mt-20 lg:mt-32">
            {/*
              Same flared curve SVG to match the Choose Your Story banner.
            */}
            <svg
              viewBox="0 0 1728 311"
              className="w-full block h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px]"
              preserveAspectRatio="none"
            >
              <path
                fill="#914A8C"
                d="M66.9068 29.469L-1 0V297L60.6428 263.852C89.7598 248.195 122.304 240 155.364 240H278.89H416.829H535.5H698.224H836.5H1016.5H1151H1331.5H1500.38C1574.97 240 1648.08 260.856 1711.44 300.213L1728 310.5V0L1650.63 31.3555C1626.77 41.0275 1601.26 46 1575.51 46H1331.5H1151H1016.5H836.5H698.224H535.5H416.829H278.89H146.525C119.134 46 92.0343 40.3734 66.9068 29.469Z"
              />
            </svg>

            {/* Text overlay — centered vertically over the SVG */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="max-w-7xl mx-auto w-full px-8 md:px-14 lg:px-20 relative">
                <h2
                  className={`
                    ${chauPhilomeneOne.className}
                    text-white
                    uppercase
                    text-2xl
                    sm:text-3xl
                    md:text-4xl
                    lg:text-5xl
                    z-30
                    relative
                  `}
                >
                  How to personalize
                </h2>
              </div>
            </div>

            {/* Kid + Robot */}
            <div
              className="
                absolute
                right-0
                sm:right-4
                md:right-8
                lg:right-14
                xl:right-20
                top-1/2
                -translate-y-1/2
                z-30
                pointer-events-none
                select-none
              "
            >
              <Image
                src="/assets/home_page/kidWithRobo.png"
                alt="Kid with Robot"
                width={520}
                height={520}
                priority
                className="
                  w-[140px]
                  sm:w-[180px]
                  md:w-[240px]
                  lg:w-[300px]
                  xl:w-[360px]
                  h-auto
                  object-contain
                "
              />
            </div>
          </div>

          {/* Content Section: Cream Background */}
          <section className="bg-[#F8E7D2] pb-24 pt-10 md:pt-16 relative">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* Left Column: Video Mockup */}
                <div className="relative w-full flex justify-center lg:justify-start">
                  <HowItWorksVideo
                    videoUrl={howItWorks.videoUrl}
                    posterUrl={howItWorks.posterUrl ?? undefined}
                  />
                </div>

                {/* Right Column: Steps */}
                <div className="flex flex-col gap-8 md:gap-10">
                  {howItWorks.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-5 group">
                      {/* Circular Step Badge */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#914B8C] flex items-center justify-center text-white font-bold text-xl shadow-md transition-all duration-300 group-hover:scale-110">
                        {index + 1}
                      </div>

                      {/* Text Content */}
                      <div className={`${hankenGrotesk.className} flex flex-col gap-1.5`}>
                        <h4 className="text-[#1A1A1A] font-extrabold text-xl md:text-2xl transition-colors duration-300 group-hover:text-[#914B8C]">
                          {step.heading}
                        </h4>
                        <p className="text-[#555555] font-medium text-sm md:text-base leading-relaxed max-w-lg">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function HowItWorksVideo({ videoUrl, posterUrl }: { videoUrl?: string | null; posterUrl?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  if (!videoUrl) return null;

  const onTogglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current?.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const onToggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="flex justify-center w-full">
      <div
        className="
          relative
          w-full
          max-w-[400px]
          aspect-[4/5]
          transition-transform
          duration-300
          hover:scale-[1.03]
        "
      >
        {/* Purple offset shadow */}
        <div className="absolute top-4 left-4 w-full h-full bg-[#914B8C] rounded-[24px] md:rounded-[32px] z-0" />

        {/* Video Content Container */}
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden cursor-pointer z-10 rounded-[24px] md:rounded-[32px]"
          onClick={onTogglePlay}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Interactive Mute Overlay */}
          {isPlaying && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm z-20 hover:bg-black/60 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          )}

          {/* Custom Play Button Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/30 backdrop-blur-[2px] flex items-center justify-center shadow-lg transition-all duration-300 transform">
                <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10 text-white fill-current ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
