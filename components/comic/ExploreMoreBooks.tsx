"use client";

import Image from "next/image";
import { chauPhilomeneOne } from "@/app/fonts";
import { useLatestPublicComics } from "@/hooks/usePublicComics";
import StoryCard from "@/components/home/StoryCard";

interface ExploreMoreBooksProps {
  comicId: string;
}

export default function ExploreMoreBooks({ comicId }: ExploreMoreBooksProps) {
  const { data: comics, isLoading } = useLatestPublicComics(comicId, 4);

  if (!isLoading && (!comics || comics.length === 0)) {
    return null;
  }

  return (
    <>
      {/* ===== Purple Wave Banner ===== */}
      <div className="relative w-full overflow-visible">
        {/* SVG Background */}
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
              Explore More Books
            </h2>
          </div>
        </div>

        {/* Explorer Boy Image — Top-Right, overlapping the banner */}
        <Image
          src="/assets/home_page/Explore-boy.png"
          alt="Explorer Boy"
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

      {/* ===== Cards Grid ===== */}
      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[#555555] font-medium">Loading stories...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pb-16">
              {comics.map((comic) => (
                <StoryCard key={comic.id} comic={comic} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
