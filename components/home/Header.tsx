"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Search, User, ShoppingBag, ChevronDown, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { UserRole } from "@/app/types/auth";

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
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [hideBulb, setHideBulb] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  {/* Hide bulb and header on scroll */ }
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHideBulb(currentScrollY > 80);

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
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
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className={`
        fixed
        top-0
        left-0
        w-full
        h-[86px]
        z-50
        overflow-visible
        transition-transform
        duration-300
        ${showHeader ? "translate-y-0" : "-translate-y-full"}
      `}
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
          {/* Admin Settings - Only visible to admins */}
          {!loading && user?.role === UserRole.ADMIN && (
            <Link href="/admin" className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1">
              <Settings size={20} strokeWidth={2} />
            </Link>
          )}

          {/* Wishlist */}
          <button className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1">
            <Heart size={20} strokeWidth={2} />
          </button>

          {/* Search */}
          <button className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1">
            <Search size={20} strokeWidth={2} />
          </button>

          {/* Profile */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setIsProfileOpen(!isProfileOpen);
                } else {
                  router.push("/login");
                }
              }}
              className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1"
            >
              <User size={20} strokeWidth={2} />
            </button>

            {isProfileOpen && isAuthenticated && user && (
              <div className="absolute right-0 mt-3.5 w-48 bg-[#914A8C] border border-white/20 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 flex flex-col gap-0.5">
                  <span className="text-sm font-semibold truncate text-white">{user.name}</span>
                  <span className="text-xs text-white/60 truncate">{user.email}</span>
                </div>
                
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/15 transition-colors text-white cursor-pointer"
                >
                  <Settings size={16} />
                  <span className="font-medium flex-1">Settings</span>
                </button>
                
                <div className="h-px bg-white/10 my-1 mx-2"></div>
                
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/15 transition-colors text-white cursor-pointer"
                >
                  <LogOut size={16} />
                  <span className="font-medium flex-1">Logout</span>
                </button>
              </div>
            )}
          </div>

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

      {/* Background SVG shape with contour-hugging shadow */}
      <div className="absolute inset-0 w-full h-[138px] pointer-events-none -z-10 drop-shadow-md">
        <svg
          className="w-full h-full"
          viewBox="0 0 1728 205"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0H1728V205L1699.6 175.084C1670.8 144.755 1630.82 127.582 1589 127.582H1511.5H1436H1348.5H1280H1205H1128H1044.5H957H869H775.5H686.5H600H524H441H356.5H295.5H229H156.5C112.973 127.582 70.9127 143.315 38.0718 171.883L0 205V0Z"
            fill="#914A8C"
          />
        </svg>
      </div>

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


    </nav>
  );
}
