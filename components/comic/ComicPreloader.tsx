"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

interface ComicPreloaderProps {
  childName: string;
  redirectUrl: string;
}

export default function ComicPreloader({ childName, redirectUrl }: ComicPreloaderProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 50 seconds total
    const totalTime = 50000;
    const intervalTime = 500;
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      // Uneven progress logic:
      const baseProgress = (currentStep / steps) * 100;
      // Add random offset between -3 and +5 for that "stuttering" feel
      let randomOffset = Math.random() * 8 - 3;
      let newProgress = baseProgress + randomOffset;
      
      // Enforce bounds
      if (newProgress < 0) newProgress = 0;
      if (newProgress > 98 && currentStep < steps) newProgress = 98; // Cap at 98 until done
      
      if (currentStep >= steps) {
        newProgress = 100;
        clearInterval(interval);
        router.push(redirectUrl);
      }
      
      setProgress(newProgress);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [router, redirectUrl]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[calc(100vh-200px)] py-4 px-4 overflow-hidden">
       <h1 className={`${chauPhilomeneOne.className} text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] text-center mb-3`}>
          Generating {childName}&apos;s Book
       </h1>
       <p className={`${hankenGrotesk.className} text-sm md:text-base text-gray-700 text-center mb-6`}>
          UniLake stands for an Univeral Lake of Ideas
       </p>
       
       <div className="w-full max-w-lg bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div 
             className="bg-[#3F3C95] h-full rounded-full transition-all duration-300 ease-out" 
             style={{ width: `${progress}%` }}
          ></div>
       </div>

       <div className="relative w-full max-w-4xl flex-1 min-h-[250px] max-h-[500px]">
          <Image
            src="/assets/bb6bfa052a589a79ee6faa505134d5646df98202.png"
            alt="Generating Book"
            fill
            className="object-contain"
            priority
          />
       </div>
    </div>
  );
}
