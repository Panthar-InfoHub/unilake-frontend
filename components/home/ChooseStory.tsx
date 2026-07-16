"use client";

import { useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import StoryFilters from "@/components/home/StoryFilters";
import StoryCard from "@/components/home/StoryCard";
import { stories } from "@/data/storyData";

const personalisationSteps = [
  {
    number: 1,
    title: "Introduce Your Child",
    description: "Start by giving us a few details about your child — their name, gender, and some clear photos.",
  },
  {
    number: 2,
    title: "AI-Powered Face Mapping",
    description: "Our AI analyzes your child's photos to build precise facial structure, which are recreated into every page of the story.",
  },
  {
    number: 3,
    title: "Preview Before You Commit",
    description: "We'll generate a free preview of the first few pages so you can see the magic in action before making any decisions.",
  },
  {
    number: 4,
    title: "Purchase & Fine Tune",
    description: "Once you purchase, the entire book unlocks. You can also regenerate the pages until complete satisfaction.",
  },
  {
    number: 5,
    title: "Give approval for Print",
    description: "Once you are completely satisfied with the generation, Give your approval and send for Print.",
  },
  {
    number: 6,
    title: "Your Delivery is on the way",
    description: "Your storybook is printed on high-quality paper and delivered straight to your doorstep within approx. 7 business days.",
  },
];

export default function ChooseStory() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (filterId: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: prev[filterId] === value ? "" : value,
    }));
  };

  const parseRange = (str: string): [number, number] => {
    const cleaned = str.replace(/AGE/i, "").trim();
    if (cleaned.endsWith("+")) {
      return [parseInt(cleaned), 99];
    }
    const parts = cleaned.split("-").map((p) => parseInt(p.trim()));
    if (parts.length === 2) return [parts[0], parts[1]];
    return [0, 99];
  };

  const filteredStories = stories.filter((story) => {
    // Filter by Age
    if (selectedFilters.age) {
      const [sMin, sMax] = parseRange(story.ageRange);
      const [fMin, fMax] = parseRange(selectedFilters.age);
      if (fMax < sMin || fMin > sMax) return false;
    }

    // Filter by Theme (Category)
    if (selectedFilters.theme) {
      if (story.category.toLowerCase() !== selectedFilters.theme.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  return (
    <>
      {/* ===== Purple Wave Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/* Top Wave */}
        <div className="w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 80"
            className="w-full h-[30px] sm:h-[50px] md:h-[70px] lg:h-[90px] block"
            preserveAspectRatio="none"
          >
            <path
              fill="#8E4A92"
              d="M 0 0 L 0 80 L 1440 80 L 1440 0 Q 720 80 0 0 Z"
            />
          </svg>
        </div>

        {/* Middle Purple Band */}
        <div className="bg-[#8E4A92] w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px] flex items-center relative z-10">
          <div className="max-w-7xl mx-auto w-full px-8 md:px-14 lg:px-20">
            <h2
              className={`
                ${chauPhilomeneOne.className}
                text-white
                uppercase
                text-3xl
                sm:text-4xl
                md:text-5xl
                lg:text-6xl
                z-30
                relative
              `}
            >
              Choose Your Story
            </h2>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 80"
            className="w-full h-[30px] sm:h-[50px] md:h-[70px] lg:h-[90px] block"
            preserveAspectRatio="none"
          >
            <path
              fill="#8E4A92"
              d="M 0 80 L 0 0 L 1440 0 L 1440 80 Q 720 0 0 80 Z"
            />
          </svg>
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
            right-0
            lg:right-4
            
            bottom-[-10px]
            sm:bottom-[-15px]
            md:bottom-[-20px]
            lg:bottom-[-25px]
            xl:bottom-[-30px]

            w-[240px]
            sm:w-[360px]
            md:w-[480px]
            lg:w-[580px]
            xl:w-[680px]

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-16">
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== "How It Works" Section ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/* Top Wave: Dips down in the middle */}
        <div className="w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 80"
            className="w-full h-[30px] sm:h-[50px] md:h-[70px] lg:h-[90px] block"
            preserveAspectRatio="none"
          >
            <path
              fill="#8E4A92"
              d="M 0 0 L 0 80 L 1440 80 L 1440 0 Q 720 80 0 0 Z"
            />
          </svg>
        </div>

        {/* Middle Purple Band */}
        <div className="bg-[#8E4A92] w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px] flex items-center relative z-10">
          <div className="max-w-7xl mx-auto w-full px-8 md:px-14 lg:px-20 relative">
            <h2
              className={`
                ${chauPhilomeneOne.className}
                text-white
                uppercase
                text-3xl
                sm:text-4xl
                md:text-5xl
                lg:text-6xl
                z-30
                relative
              `}
            >
              How It Works
            </h2>
          </div>
        </div>

        {/* Bottom Wave: Arches up in the middle */}
        <div className="w-full overflow-hidden leading-[0] relative z-10">
          <svg
            viewBox="0 0 1440 80"
            className="w-full h-[30px] sm:h-[50px] md:h-[70px] lg:h-[90px] block"
            preserveAspectRatio="none"
          >
            <path
              fill="#8E4A92"
              d="M 0 80 L 0 0 L 1440 0 L 1440 80 Q 720 0 0 80 Z"
            />
          </svg>
        </div>

        {/* Kid with Robot Image - Overlaps purple band and waves */}
        {/* Kid with Robot Image - Overlaps purple band and waves */}
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
      w-[180px]
      sm:w-[240px]
      md:w-[320px]
      lg:w-[420px]
      xl:w-[500px]
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
              <div className="relative w-full max-w-[500px] aspect-[616/695] transition-transform duration-300 hover:scale-[1.01]">
                {/* videoImg.png already has standard curves and shadow, so we render it directly */}
                <Image
                  src="/assets/home_page/videoImg.png"
                  alt="How to Personalise Video"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className="object-contain"
                  priority
                />

                {/* Play Button Overlay - centered inside the video image block */}
                <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/35 backdrop-blur-[2px] flex items-center justify-center shadow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:bg-white/45">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-white fill-current ml-1"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 6 Steps */}
            <div className="flex flex-col gap-8 md:gap-10">
              {personalisationSteps.map((step) => (
                <div key={step.number} className="flex items-start gap-5 group">
                  {/* Circular Step Badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#8E4A92] flex items-center justify-center text-white font-bold text-xl shadow-md transition-all duration-300 group-hover:scale-110">
                    {step.number}
                  </div>

                  {/* Text Content */}
                  <div className={`${hankenGrotesk.className} flex flex-col gap-1.5`}>
                    <h4 className="text-[#1A1A1A] font-extrabold text-xl md:text-2xl transition-colors duration-300 group-hover:text-[#8E4A92]">
                      {step.title}
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
  );
}
