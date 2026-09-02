"use client";

import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

import { TeamMember } from "@/app/types/teamMember";
import { Briefcase, Camera, MessageCircle } from "lucide-react";

interface OurTeamProps {
  members: TeamMember[];
}

export default function OurTeam({ members }: OurTeamProps) {
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
          <div className="max-w-7xl mx-auto w-full px-8 relative flex items-center justify-center">
            <div className="flex items-center justify-between w-full max-w-[270px] sm:max-w-[460px] md:max-w-[620px] lg:max-w-[780px] xl:max-w-[840px] px-2 sm:px-0">
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
            {members.map((member) => (
              <div key={member.id} className="flex justify-center">
                {/* Card with Exact Custom Background Frame PNG */}
                <div className="relative w-full max-w-[340px] aspect-[445/630] flex flex-col items-center text-center p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] group drop-shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
                  {/* Card Background Frame PNG */}
                  <Image
                    src="/assets/home_page/teamCardFrame.png"
                    alt="Card Background"
                    fill
                    className="pointer-events-none select-none z-0 object-contain"
                    priority
                  />

                  {/* Card Content Container */}
                  <div className="relative z-10 flex flex-col items-center text-center w-full h-full pt-6">
                    {/* Team Member Avatar */}
                    <div className="relative w-full aspect-square max-w-[170px] sm:max-w-[190px] mb-4 rounded-full overflow-hidden flex items-center justify-center bg-[#914B8C]/10 border-2 border-white shadow-sm">
                      {member.imageUrl ? (
                        <Image
                          src={member.imageUrl}
                          alt={member.name}
                          fill
                          sizes="190px"
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <span className={`${chauPhilomeneOne.className} text-[#914B8C] text-5xl uppercase`}>
                          {member.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h4 className={`${hankenGrotesk.className} text-[#914B8C] font-extrabold text-xl sm:text-2xl mb-1`}>
                      {member.name}
                    </h4>

                    {/* Role */}
                    <span className={`${hankenGrotesk.className} text-[#000000] font-bold text-sm sm:text-base mb-3 block`}>
                      ({member.role})
                    </span>

                    {/* Description */}
                    {member.description && (
                      <p className={`${hankenGrotesk.className} text-[#555555] text-xs sm:text-sm font-medium leading-relaxed mb-4 max-w-[250px]`}>
                        {member.description}
                      </p>
                    )}

                    {/* Social Links */}
                    {(member.linkedinUrl || member.instagramUrl || member.twitterUrl) && (
                      <div className="flex items-center justify-center gap-4 mt-auto pb-4">
                        {member.linkedinUrl && (
                          <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors cursor-pointer">
                            <Briefcase className="w-4 h-4" />
                          </a>
                        )}
                        {member.instagramUrl && (
                          <a href={member.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors cursor-pointer">
                            <Camera className="w-4 h-4" />
                          </a>
                        )}
                        {member.twitterUrl && (
                          <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors cursor-pointer">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
