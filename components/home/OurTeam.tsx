"use client";

import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

/* ── Dummy Team Members data ── */
const teamMembers = [
  {
    id: 1,
    name: "Aham Gupta",
    role: "Graphic Designer",
    description: "A Graphic Designer Is A Creative Professional Who Uses Visual Elements To Communicate Ideas And Messages.....",
    avatar: "/assets/home_page/teamSectionImg.png",
  },
  {
    id: 2,
    name: "Aham Gupta",
    role: "Graphic Designer",
    description: "A Graphic Designer Is A Creative Professional Who Uses Visual Elements To Communicate Ideas And Messages.....",
    avatar: "/assets/home_page/teamSectionImg.png",
  },
  {
    id: 3,
    name: "Aham Gupta",
    role: "Graphic Designer",
    description: "A Graphic Designer Is A Creative Professional Who Uses Visual Elements To Communicate Ideas And Messages.....",
    avatar: "/assets/home_page/teamSectionImg.png",
  },
];

export default function OurTeam() {
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
          <div className="max-w-7xl mx-auto w-full px-8 relative flex items-center justify-center">
            <div className="flex items-center justify-between w-full max-w-[340px] sm:max-w-[460px] md:max-w-[620px] lg:max-w-[780px] xl:max-w-[840px]">
              {/* Left Title Word */}
              <h2
                className={`
                  ${chauPhilomeneOne.className}
                  text-white
                  uppercase
                  text-2xl
                  sm:text-3xl
                  md:text-4xl
                  lg:text-5xl
                  xl:text-6xl
                  z-30
                  relative
                `}
              >
                Our
              </h2>

              {/* Right Title Word */}
              <h2
                className={`
                  ${chauPhilomeneOne.className}
                  text-white
                  uppercase
                  text-2xl
                  sm:text-3xl
                  md:text-4xl
                  lg:text-5xl
                  xl:text-6xl
                  z-30
                  relative
                `}
              >
                Team
              </h2>
            </div>
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

        {/* Center Team main overlay image */}
        <div
          className="
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            z-20
            pointer-events-none
            select-none
            w-[160px]
            sm:w-[240px]
            md:w-[320px]
            lg:w-[400px]
            xl:w-[460px]
            h-auto
          "
        >
          <Image
            src="/assets/home_page/teamSectionMainImg.png"
            alt="Our Team Characters"
            width={460}
            height={320}
            priority
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* ===== Team Grid Section ===== */}
      <section className="bg-[#F8E7D2] pb-24 pt-14 md:pt-20 relative">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          
          {/* 3-Column Team Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 lg:gap-x-12">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex justify-center">
                {/* Organic wobbly outline card */}
                <div
                  className="
                    relative
                    w-full
                    max-w-[340px]
                    bg-white
                    rounded-[48px]
                    p-8
                    shadow-[0_10px_30px_rgba(0,0,0,0.05)]
                    flex flex-col
                    items-center
                    text-center
                    transition-all duration-300
                    hover:scale-[1.02]
                    hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)]
                  "
                >
                  {/* Team Member Avatar */}
                  <div className="relative w-full aspect-square max-w-[220px] mb-6">
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      fill
                      sizes="220px"
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Name */}
                  <h4 className={`${hankenGrotesk.className} text-[#8E4A92] font-extrabold text-xl sm:text-2xl mb-1`}>
                    {member.name}
                  </h4>

                  {/* Role */}
                  <span className={`${hankenGrotesk.className} text-[#000000] font-bold text-sm sm:text-base mb-4 block`}>
                    ({member.role})
                  </span>

                  {/* Description */}
                  <p className={`${hankenGrotesk.className} text-[#555555] text-sm sm:text-base font-medium leading-relaxed`}>
                    {member.description}
                    <span className="text-[#8E4A92] ml-1 font-bold cursor-pointer hover:underline">
                      (More)
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}
