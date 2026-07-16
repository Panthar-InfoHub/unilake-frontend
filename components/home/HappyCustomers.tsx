"use client";

import { useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne } from "@/app/fonts";

/* ── Dummy testimonial video data ── */
const testimonials = [
  { id: 1, title: "Happy Customer 1", thumbnail: "/assets/home_page/videoImg.png" },
  { id: 2, title: "Happy Customer 2", thumbnail: "/assets/home_page/videoImg.png" },
  { id: 3, title: "Happy Customer 3", thumbnail: "/assets/home_page/videoImg.png" },
  { id: 4, title: "Happy Customer 4", thumbnail: "/assets/home_page/videoImg.png" },
  { id: 5, title: "Happy Customer 5", thumbnail: "/assets/home_page/videoImg.png" },
  { id: 6, title: "Happy Customer 6", thumbnail: "/assets/home_page/videoImg.png" },
];

const ITEMS_PER_PAGE = 3;

export default function HappyCustomers() {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(testimonials.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const visibleVideos = testimonials.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* ===== Purple Hourglass Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/* Top Wave: Dips down in the middle */}
        <div className="w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 80"
            className="w-full h-[15px] sm:h-[25px] md:h-[35px] lg:h-[45px] block"
            preserveAspectRatio="none"
          >
            <path
              fill="#8E4A92"
              d="M 0 0 L 0 80 L 1440 80 L 1440 0 Q 720 80 0 0 Z"
            />
          </svg>
        </div>

        {/* Middle Purple Band */}
        <div className="bg-[#8E4A92] w-full h-[40px] sm:h-[50px] md:h-[60px] lg:h-[70px] flex items-center justify-center relative z-10">
          <h2
            className={`
              ${chauPhilomeneOne.className}
              text-white
              uppercase
              text-xl
              sm:text-2xl
              md:text-3xl
              lg:text-4xl
              xl:text-5xl
              text-center
              z-30
              relative
            `}
          >
            UniLake&rsquo;s Happy Customers
          </h2>
        </div>

        {/* Bottom Wave: Arches up in the middle */}
        <div className="w-full overflow-hidden leading-[0] relative z-10">
          <svg
            viewBox="0 0 1440 80"
            className="w-full h-[15px] sm:h-[25px] md:h-[35px] lg:h-[45px] block"
            preserveAspectRatio="none"
          >
            <path
              fill="#8E4A92"
              d="M 0 80 L 0 0 L 1440 0 L 1440 80 Q 720 0 0 80 Z"
            />
          </svg>
        </div>

        {/* Dino Image — Top-Left, sitting above the bar */}
        <div
          className="
            absolute
            left-2
            sm:left-6
            md:left-10
            lg:left-16
            xl:left-24

            bottom-[20px]
            sm:bottom-[30px]
            md:bottom-[40px]
            lg:bottom-[45px]

            z-30
            pointer-events-none
            select-none
          "
        >
          <Image
            src="/assets/home_page/dinoImg.png"
            alt="Kid riding dinosaur"
            width={480}
            height={480}
            priority
            className="
              w-[100px]
              sm:w-[140px]
              md:w-[200px]
              lg:w-[260px]
              xl:w-[300px]
              h-auto
              object-contain
            "
          />
        </div>
      </div>

      {/* ===== Testimonial Videos Section ===== */}
      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Video Grid — 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {visibleVideos.map((video) => (
              <div key={video.id} className="flex justify-center">
                {/* Scrapbook-style frame */}
                <div
                  className="
                    relative
                    w-full
                    max-w-[280px]
                    bg-white
                    rounded-xl
                    p-3
                    shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                    transition-transform
                    duration-300
                    hover:scale-[1.03]
                  "
                >
                  {/* Grid pattern background */}
                  <div className="absolute inset-0 rounded-xl opacity-[0.08] pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #999 1px, transparent 1px),
                        linear-gradient(to bottom, #999 1px, transparent 1px)
                      `,
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* Neon-green decorative accents */}
                  <div className="absolute top-4 right-4 w-10 h-14 bg-[#CBFF3C] rounded-sm rotate-[-8deg] opacity-80 z-0" />
                  <div className="absolute bottom-4 left-4 w-12 h-10 bg-[#CBFF3C] rounded-sm rotate-[6deg] opacity-80 z-0" />
                  <div className="absolute top-6 left-6 w-6 h-8 bg-[#CBFF3C]/60 rounded-sm rotate-[12deg] z-0" />
                  <div className="absolute bottom-6 right-6 w-8 h-6 bg-[#CBFF3C]/60 rounded-sm rotate-[-5deg] z-0" />

                  {/* Video Thumbnail */}
                  <div className="relative aspect-[9/16] rounded-lg overflow-hidden z-10">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />

                    {/* Mute icon — top right */}
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm z-20">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    </div>

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center group/play cursor-pointer z-20">
                      <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-[2px] flex items-center justify-center shadow-lg transition-all duration-300 transform group-hover/play:scale-110 group-hover/play:bg-white/45">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-0.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Previous / Next Navigation ===== */}
          <div className="flex items-center justify-center gap-4 mt-12">
            {/* Previous Button */}
            <button
              onClick={goToPrev}
              className="
                w-12 h-12
                rounded-full
                bg-[#8E4A92]
                flex items-center justify-center
                text-white
                shadow-md
                transition-all duration-300
                hover:scale-110
                hover:bg-[#7A3E7E]
                active:scale-95
                cursor-pointer
              "
              aria-label="Previous videos"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            {/* Dash separator */}
            <div className="w-8 h-1 bg-[#8E4A92] rounded-full" />

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="
                w-12 h-12
                rounded-full
                bg-[#8E4A92]
                flex items-center justify-center
                text-white
                shadow-md
                transition-all duration-300
                hover:scale-110
                hover:bg-[#7A3E7E]
                active:scale-95
                cursor-pointer
              "
              aria-label="Next videos"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>

        </div>
      </section>
    </>
  );
}
