"use client";

import Image from "next/image";
import { Mail } from "lucide-react";
import { hankenGrotesk } from "@/app/fonts";

export default function Footer() {
  return (
    <footer className="relative w-full overflow-visible mt-20 lg:mt-32">
      {/* ===== Symmetrical/Organic Double Wave Cloud Border ===== */}
      <div className="w-full overflow-hidden leading-[0] relative">
        <svg
          viewBox="0 0 1440 120"
          className="w-full h-[50px] sm:h-[75px] md:h-[100px] lg:h-[120px] block"
          preserveAspectRatio="none"
        >
          {/* Yellow Cloud Layer */}
          <path
            fill="#FFCB05"
            d="M0,120 L0,60 Q90,10 180,60 Q270,10 360,60 Q450,10 540,60 Q630,10 720,60 Q810,10 900,60 Q990,10 1080,60 Q1170,10 1260,60 Q1350,10 1440,60 L1440,120 Z"
          />
          {/* Purple Cloud Layer (shifted down slightly) */}
          <path
            fill="#8E4A92"
            d="M0,120 L0,80 Q90,30 180,80 Q270,30 360,80 Q450,30 540,80 Q630,30 720,80 Q810,30 900,80 Q990,30 1080,80 Q1170,30 1260,80 Q1350,30 1440,80 L1440,120 Z"
          />
        </svg>

        {/* Sun Overlay - Top-Right */}
        <div
          className="
            absolute
            right-12
            sm:right-20
            md:right-28
            lg:right-36
            xl:right-40

            top-[0px]
            sm:-top-[2px]
            md:-top-[5px]
            lg:-top-[7px]
            xl:-top-[10px]

            w-[50px]
            sm:w-[70px]
            md:w-[85px]
            lg:w-[100px]
            xl:w-[110px]

            z-20
            pointer-events-none
            select-none
          "
        >
          <Image
            src="/assets/home_page/sun-logo-8FjyKkdiCt.png"
            alt="Sun"
            width={110}
            height={110}
            priority
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* ===== Solid Purple Footer Body ===== */}
      <div className="bg-[#8E4A92] text-white pt-10 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            
            {/* Left Column: Brand & Logo */}
            <div className="md:col-span-6 flex flex-col items-start">
              {/* UniLake Logo */}
              <div className="mb-6">
                <Image
                  src="/assets/home_page/logoImg.png"
                  alt="UniLake Logo"
                  width={170}
                  height={60}
                  style={{ width: "auto", height: "auto" }}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Description */}
              <p className={`${hankenGrotesk.className} text-white/90 text-sm sm:text-base leading-relaxed max-w-sm mb-6`}>
                Bringing children&rsquo;s imaginations to life through magical personalized stories that families will treasure for years to come.
              </p>

              {/* Social Buttons */}
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-white
                    text-[#8E4A92]
                    flex
                    items-center
                    justify-center
                    shadow-md
                    transition-all
                    duration-250
                    hover:scale-110
                    hover:bg-[#FFCB05]
                    hover:text-black
                  "
                  aria-label="Instagram"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>

                <a
                  href="mailto:contact@unilake.com"
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-white
                    text-[#8E4A92]
                    flex
                    items-center
                    justify-center
                    shadow-md
                    transition-all
                    duration-250
                    hover:scale-110
                    hover:bg-[#FFCB05]
                    hover:text-black
                  "
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5 fill-none stroke-current stroke-[2]" />
                </a>
              </div>
            </div>

            {/* Middle Column: Explore */}
            <div className="md:col-span-3 flex flex-col items-start md:items-center">
              <div className="flex flex-col items-start">
                <h4 className="text-lg font-black uppercase tracking-widest mb-6">
                  Explore
                </h4>
                <ul className={`${hankenGrotesk.className} flex flex-col gap-3.5 text-sm sm:text-base font-bold text-white/90`}>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      HOME
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      BOOKS
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      BLOG
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      TEAM
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      HOW IT WORKS
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Legal & Support */}
            <div className="md:col-span-3 flex flex-col items-start md:items-center">
              <div className="flex flex-col items-start">
                <h4 className="text-lg font-black uppercase tracking-widest mb-6">
                  Legal &amp; Support
                </h4>
                <ul className={`${hankenGrotesk.className} flex flex-col gap-3.5 text-sm sm:text-base font-bold text-white/90`}>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      PRIVACY
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      TERMS
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#FFCB05] transition-colors duration-200">
                      CONTACT
                    </a>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
