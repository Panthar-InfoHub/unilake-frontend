"use client";

import { useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { Faq } from "@/app/types/faq";

interface HomeFaqProps {
  faqs: Faq[];
}

export default function HomeFaq({ faqs }: HomeFaqProps) {
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
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
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

        {/* Text/SVG overlay — centered vertically over the SVG */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto w-full px-8 relative flex items-center justify-start">
            <div
              className="
                z-30
                relative
                pl-[80px]
                sm:pl-[120px]
                md:pl-[180px]
                lg:pl-[240px]
                xl:pl-[280px]
              "
            >
              <Image
                src="/FAQ’s & FEEDBACK.svg"
                alt="FAQ's & FEEDBACK"
                width={764}
                height={68}
                className="
                  w-auto
                  h-5
                  sm:h-7
                  md:h-9
                  lg:h-11
                  xl:h-12
                  object-contain
                "
                priority
              />
            </div>
          </div>
        </div>

        {/* Girl Image — Top-Left, sitting above the bar with space */}
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
            src="/assets/home_page/girlFeedbackImg.png"
            alt="Girl student raising hand"
            width={280}
            height={280}
            priority
            className="
              w-[90px]
              sm:w-[150px]
              md:w-[160px]
              lg:w-[200px]
              xl:w-[250px]
              h-auto
              object-contain
            "
          />
        </div>
      </div>

      {/* ===== Content Section ===== */}
      <section className="bg-[#F8E7D2] pb-6 pt-14 md:pt-20 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">

          {/* FAQ Accordion List */}
          <div className="flex flex-col gap-5 mb-16">
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
                        <div className="w-6 h-[3px] bg-[#8E4A92] rounded-full" />
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
                        ${isExpanded ? "text-[#8E4A92]" : ""}
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
                    {/* PLAIN TEXT rendering — never use dangerouslySetInnerHTML here */}
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
