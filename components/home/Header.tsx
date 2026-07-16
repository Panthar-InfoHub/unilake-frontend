"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Heart, Search, User, ShoppingBag, ChevronDown } from "lucide-react";

interface Country {
  code: string;
  name: string;
  flag: string;
}

const countries: Country[] = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
];


export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hideBulb, setHideBulb] = useState(false);

  {/* Hide bulb on scroll */ }
  useEffect(() => {
    const handleScroll = () => {
      setHideBulb(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className="
    fixed
    top-0
    left-0
    w-full
    h-[86px]
    bg-[#914A8C]
    shadow-md
    z-50
    overflow-visible
  "
    >
      <div className="max-w-[1440px] mx-auto h-full px-10 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/assets/home_page/logoImg.png"
            alt="UniLake Logo"
            width={170}
            height={60}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </div>

        {/* Navigation Links */}
        <ul className="hidden lg:flex items-center gap-12 text-white text-[15px] font-medium tracking-wide">
          <li className="text-[#FFD54A] cursor-pointer hover:text-[#FFD54A] transition-colors duration-200">
            Home
          </li>
          <li className="hover:text-[#FFD54A] cursor-pointer transition-colors duration-200">
            Our Books
          </li>
          <li className="hover:text-[#FFD54A] cursor-pointer transition-colors duration-200">
            How its works
          </li>
          <li className="hover:text-[#FFD54A] cursor-pointer transition-colors duration-200">
            Blogs
          </li>
          <li className="hover:text-[#FFD54A] cursor-pointer transition-colors duration-200">
            Team
          </li>
        </ul>

        {/* Right Section: Icons + Language Dropdown */}
        <div className="flex items-center gap-6 text-white">
          {/* Wishlist */}
          <button className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1">
            <Heart size={20} strokeWidth={2} />
          </button>

          {/* Search */}
          <button className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1">
            <Search size={20} strokeWidth={2} />
          </button>

          {/* Profile */}
          <button className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1">
            <User size={20} strokeWidth={2} />
          </button>

          {/* Cart with Blue Dot Badge */}
          <button className="relative hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1">
            <ShoppingBag size={20} strokeWidth={2} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#4AA6FF] rounded-full border border-[#914A8C]"></span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 border border-white/80 rounded-full px-3 py-1 text-[13px] hover:bg-white/10 transition-all cursor-pointer font-medium select-none"
            >
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-3.5 w-44 bg-[#914A8C] border border-white/20 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/15 transition-colors text-white cursor-pointer"
                  >
                    <span className="text-base">{country.flag}</span>
                    <span className="font-medium flex-1">{country.name}</span>
                    <span className="text-xs text-white/60 font-semibold">{country.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Left Concave Corner Curve */}
      <svg
        className="absolute bottom-0 left-0 w-[120px] h-[60px] fill-[#F8E7D2] pointer-events-none z-30"
        viewBox="0 0 120 60"
        preserveAspectRatio="none"
      >
        <path d="M 0 0 Q 0 60, 120 60 L 0 60 Z" />
      </svg>

      {/* Hanging Bulb */}
      <Image
        src="/assets/home_page/bulbImg.png"
        alt="Bulb"
        width={110}
        height={140}
        className={`
    absolute
    top-full
    left-8
    sm:left-10
    md:left-12
    lg:left-16
    xl:left-20

    -translate-y-5

    w-14
    sm:w-16
    md:w-20
    lg:w-24
    xl:w-28

    h-auto
    z-50
    pointer-events-none
    select-none

    transition-all
    duration-500

    ${hideBulb
            ? "opacity-0 -translate-y-16"
            : "opacity-100 -translate-y-5"
          }
  `}
      />

      {/* Right Concave Corner Curve */}
      <svg
        className="absolute bottom-0 right-0 w-[120px] h-[60px] fill-[#F8E7D2] pointer-events-none z-30"
        viewBox="0 0 120 60"
        preserveAspectRatio="none"
      >
        <path d="M 120 0 Q 120 60, 0 60 L 120 60 Z" />
      </svg>
    </nav>
  );
}
