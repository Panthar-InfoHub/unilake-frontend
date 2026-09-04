"use client";

import { useState } from "react";
import Image from "next/image";
import { hankenGrotesk, chauPhilomeneOne } from "@/app/fonts";
import { Faq } from "@/app/types/faq";

interface ComicPageFaqSectionProps {
  faqs: Faq[];
}

export default function ComicPageFaqSection({ faqs }: ComicPageFaqSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) {
    return null; // Don't render an empty shell
  }

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      {/* ===== Symmetrical Flared Purple Banner ===== */}
      <div className="relative w-full overflow-visible">
        {/* Flared wave SVG */}
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
          <div className="max-w-7xl mx-auto w-full px-8 relative flex items-center justify-start">
            <div
              className="
                z-30
                relative
                pl-[120px]
                sm:pl-[180px]
                md:pl-[240px]
                lg:pl-[300px]
                xl:pl-[360px]
              "
            >
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
                FAQ'S
              </h2>
            </div>
          </div>
        </div>

        {/* FAQ Girl Image — Top-Left, overlapping the banner */}
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
            src="/assets/home_page/faq-girl.png"
            alt="FAQ girl"
            width={280}
            height={280}
            priority
            className="
              w-[110px]
              sm:w-[170px]
              md:w-[220px]
              lg:w-[280px]
              xl:w-[330px]
              h-auto
              object-contain
            "
          />
        </div>
      </div>

      {/* ===== Content Section ===== */}
      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          
          {/* FAQ Accordion List */}
          <div className="flex flex-col gap-5">
            {faqs.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => toggleFaq(item.id)}
                  className="
                    bg-white
                    rounded-xl
                    p-5
                    sm:p-6
                    shadow-[0_4px_15px_rgba(0,0,0,0.03)]
                    border border-transparent
                    hover:border-black/5
                    transition-all
                    duration-200
                    cursor-pointer
                    select-none
                  "
                >
                  <div className="flex items-center gap-6">
                    {/* Toggle Icon */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {isExpanded ? (
                        /* Horizontal line — purple */
                        <div className="w-6 h-[3px] bg-[#3F3C95] rounded-full" />
                      ) : (
                        /* Plus symbol — black */
                        <svg
                          viewBox="0 0 24 24"
                          className="w-6 h-6 text-black fill-none stroke-current stroke-[3]"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </div>

                    {/* Question */}
                    <h3
                      className={`
                        ${hankenGrotesk.className}
                        font-extrabold
                        text-base
                        sm:text-lg
                        text-[#222222]
                        transition-colors
                        duration-200
                        ${isExpanded ? "text-[#3F3C95]" : ""}
                      `}
                    >
                      {item.question}
                    </h3>
                  </div>

                  {/* Answer (collapsible) */}
                  <div
                    className={`
                      overflow-hidden
                      transition-all
                      duration-300
                      ease-in-out
                      ${isExpanded ? "max-h-[300px] mt-4 opacity-100" : "max-h-0 opacity-0"}
                    `}
                  >
                    <p
                      className={`
                        ${hankenGrotesk.className}
                        text-[#555555]
                        text-sm
                        sm:text-base
                        font-medium
                        leading-relaxed
                        pl-14
                      `}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
