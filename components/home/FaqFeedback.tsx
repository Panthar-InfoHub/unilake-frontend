"use client";

import { useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

/* ── Dummy FAQ data ── */
const faqItems = [
  {
    id: 1,
    question: "Size & Quality",
    answer: "Our storybooks are printed in high-quality format (8x8 inches / 20x20 cm), featuring premium 200 GSM glossy paper and a durable hardcover or softcover that is perfect for kids.",
  },
  {
    id: 2,
    question: "How do I Place an order with Comfy",
    answer: "Placing an order with Comfy is simple. First, select your preferred book. You will then receive a free preview of the first 13 pages to see how well the personalization works. Once you make a purchase, the full book is unlocked. You may fine-tune any face generations as needed, review the complete book, and approve it when you are fully satisfied. Your storybook is then printed on premium 200 GSM glossy paper and shipped to your doorstep in approximately 7 business days.",
  },
  {
    id: 3,
    question: "Delivery Timeline",
    answer: "Your storybook is printed on high-quality paper and delivered straight to your doorstep within approx. 7 business days.",
  },
  {
    id: 4,
    question: "Cancellation & Refund Policy",
    answer: "Since each storybook is completely personalized for your child, we cannot accept returns once printed. However, you can cancel your order anytime before giving your final approval for print and receive a full refund.",
  },
  {
    id: 5,
    question: "Are my photo is safe",
    answer: "Yes, your photos are completely safe with us. We use secure cloud storage and only process images to generate the facial structure for your personalized storybook. We never share or sell your photos to third parties.",
  },
];

export default function FaqFeedback() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
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

        {/* Text overlay — centered vertically over the SVG */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
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
                pl-[80px]
                sm:pl-[120px]
                md:pl-[180px]
                lg:pl-[240px]
                xl:pl-[280px]
              `}
            >
              FAQ&rsquo;s &amp; FEEDBACK
            </h2>
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
      <section className="bg-[#F8E7D2] pb-24 pt-14 md:pt-20 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">

          {/* FAQ Accordion List */}
          <div className="flex flex-col gap-5 mb-16">
            {faqItems.map((item) => {
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

          {/* ===== Feedback & Suggestion Form ===== */}
          <div className="flex flex-col gap-6">
            {/* Header with purple circle dot */}
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-[#8E4A92] shadow-sm" />
              <h3
                className={`
                  ${hankenGrotesk.className}
                  font-extrabold
                  text-[#000000]
                  text-xl
                  sm:text-2xl
                  uppercase
                  tracking-wide
                `}
              >
                Feedback &amp; Suggestion
              </h3>
            </div>

            {/* Input Box Card */}
            <div
              className="
                bg-white
                rounded-2xl
                p-5
                sm:p-6
                shadow-[0_4px_15px_rgba(0,0,0,0.03)]
                border border-[#E5E7EB]
              "
            >
              <textarea
                placeholder="Write your feedback & Suggestions for our books"
                rows={4}
                className={`
                  ${hankenGrotesk.className}
                  w-full
                  bg-transparent
                  border-none
                  outline-none
                  resize-none
                  text-[#222222]
                  placeholder-[#888888]
                  text-sm
                  sm:text-base
                  font-medium
                `}
              />
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
