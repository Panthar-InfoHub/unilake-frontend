"use client";

import { useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

/* ── Dummy Google Reviews data ── */
const allReviews = [
  {
    id: 1,
    author: "Kamlesh Patel",
    text: "Great Experience. Print Quality came out much better than expected. Kids loved it. Highly recommended!!",
    avatar: "/assets/home_page/babyCustomerReviewImg.png",
  },
  {
    id: 2,
    author: "Kamlesh Patel",
    text: "Great Experience. Print Quality came out much better than expected. Kids loved it. Highly recommended!!",
    avatar: "/assets/home_page/babyCustomerReviewImg.png",
  },
  {
    id: 3,
    author: "Kamlesh Patel",
    text: "Great Experience. Print Quality came out much better than expected. Kids loved it. Highly recommended!!",
    avatar: "/assets/home_page/babyCustomerReviewImg.png",
  },
  {
    id: 4,
    author: "Kamlesh Patel",
    text: "Great Experience. Print Quality came out much better than expected. Kids loved it. Highly recommended!!",
    avatar: "/assets/home_page/babyCustomerReviewImg.png",
  },
  {
    id: 5,
    author: "Kamlesh Patel",
    text: "Great Experience. Print Quality came out much better than expected. Kids loved it. Highly recommended!!",
    avatar: "/assets/home_page/babyCustomerReviewImg.png",
  },
  {
    id: 6,
    author: "Kamlesh Patel",
    text: "Great Experience. Print Quality came out much better than expected. Kids loved it. Highly recommended!!",
    avatar: "/assets/home_page/babyCustomerReviewImg.png",
  },
];

const INITIAL_VISIBLE_COUNT = 3;

export default function GoogleReviews() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const handleLoadMore = () => {
    setVisibleCount(allReviews.length);
  };

  const visibleReviews = allReviews.slice(0, visibleCount);

  return (
    <>
      {/* ===== Symmetrical Hourglass Purple Banner ===== */}
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
          <div className="max-w-7xl mx-auto w-full px-8 relative flex items-center justify-start">
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
                z-30
                relative
                pl-[90px]
                sm:pl-[140px]
                md:pl-[190px]
                lg:pl-[250px]
                xl:pl-[270px]
              `}
            >
              Excellent On Google
            </h2>
          </div>
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

        {/* UFO Image — Top-Left, sitting above the bar with space */}
        <div
          className="
            absolute
            left-2
            sm:left-6
            md:left-10
            lg:left-16
            xl:left-24

            bottom-[10px]
            sm:bottom-[15px]
            md:bottom-[20px]
            lg:bottom-[22px]

            z-30
            pointer-events-none
            select-none
          "
        >
          <Image
            src="/assets/home_page/ufoImg.png"
            alt="5 Star UFO"
            width={580}
            height={220}
            priority
            className="
              w-[120px]
              sm:w-[180px]
              md:w-[260px]
              lg:w-[340px]
              xl:w-[400px]
              h-auto
              object-contain
            "
          />
        </div>
      </div>

      {/* ===== Reviews Grid Section ===== */}
      <section className="bg-[#F8E7D2] pb-24 pt-14 md:pt-20 relative">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          
          {/* 3-Column Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 lg:gap-x-12 pb-16">
            {visibleReviews.map((review, index) => (
              <div key={index} className="flex justify-center">
                {/* Wobbly outline bubble card */}
                <div
                  className="
                    relative
                    w-full
                    max-w-[340px]
                    bg-white
                    border-[3px] border-black
                    rounded-tr-[45px] rounded-bl-[45px]
                    rounded-tl-[12px] rounded-br-[12px]
                    pt-10 pb-8 px-8
                    shadow-[5px_5px_0px_rgba(0,0,0,0.15)]
                    transition-all duration-300
                    hover:scale-[1.02]
                    hover:shadow-[8px_8px_0px_rgba(0,0,0,0.2)]
                  "
                >
                  {/* Circle baby avatar mounted on the top-left */}
                  <div
                    className="
                      absolute
                      -top-6
                      -left-6
                      w-16
                      h-16
                      rounded-full
                      border-[3px] border-black
                      overflow-hidden
                      bg-white
                      shadow-md
                      z-20
                    "
                  >
                    <Image
                      src={review.avatar}
                      alt={review.author}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  {/* Stars Row */}
                  <div className="flex items-center gap-0.5 mb-4 pl-6">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-6 h-6 text-yellow-400 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className={`${hankenGrotesk.className} text-[#333333] text-sm sm:text-base font-medium leading-relaxed mb-5`}>
                    {review.text}
                  </p>

                  {/* Author Name */}
                  <h4 className={`${hankenGrotesk.className} text-[#000000] font-extrabold text-base sm:text-lg`}>
                    {review.author}
                  </h4>

                  {/* Solid Black Quotation Mark in bottom-right */}
                  <div
                    className="
                      absolute
                      -bottom-5
                      -right-4
                      w-12
                      h-12
                      bg-black
                      rounded-full
                      flex items-center justify-center
                      shadow-md
                      z-20
                    "
                  >
                    <span className="text-white text-3xl font-serif leading-none mt-2 select-none">
                      ”
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < allReviews.length && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                className="
                  bg-[#3F3C95]
                  text-white
                  px-9
                  py-3
                  rounded-full
                  font-bold
                  uppercase
                  shadow-[0_4px_0_#F26A2E]
                  hover:scale-105
                  active:translate-y-[2px]
                  active:shadow-[0_2px_0_#F26A2E]
                  transition-all duration-200
                  cursor-pointer
                "
              >
                Load More
              </button>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
