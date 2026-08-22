"use client";

import { usePublicComic } from "@/hooks/usePublicComics";
import { useCountryStore } from "@/stores/useCountryStore";
import { useState } from "react";
import { toast } from "sonner";
import { chauPhilomeneOne } from "@/app/fonts";

import { SessionSnapshot } from "@/app/types/session";
import { updateSession, attachUser } from "@/app/actions/session";
import { useRouter } from "next/navigation";
import LoginModal from "../checkout/LoginModal";
import { useAuth } from "@/app/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface PricingSectionProps {
  comicId: string;
  sessionId: string;
  snapshot: SessionSnapshot;
}

export default function PricingSection({ comicId, sessionId, snapshot }: PricingSectionProps) {
  const { data: comicDetail } = usePublicComic(comicId);
  const { selectedCountry, getCurrencySymbol } = useCountryStore();
  const [selectedFormat, setSelectedFormat] = useState<"SOFTCOVER" | "HARDCOVER" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  if (!comicDetail) return null;

  // Filter pricing rules for selected country
  const countryPricing = comicDetail.pricingRules.filter(
    (rule) => rule.country.code === selectedCountry?.code
  );

  const softcoverRule = countryPricing.find((r) => r.coverType === "SOFTCOVER");
  const hardcoverRule = countryPricing.find((r) => r.coverType === "HARDCOVER");
  
  const currencySymbol = getCurrencySymbol();

  const handleCheckout = async () => {
    if (!selectedFormat) {
      toast.error("Please select a cover format");
      return;
    }
    
    if (authLoading) return;
    
    setIsUpdating(true);
    try {
      // 1. PATCH coverType
      await updateSession(sessionId, { coverType: selectedFormat });
      
      // 2. Check auth
      if (!isAuthenticated) {
        setShowLoginModal(true);
        setIsUpdating(false);
        return;
      }
      
      // 3. Attach user if missing
      if (!snapshot.userId) {
        await attachUser(sessionId);
      }
      
      // 4. Navigate to checkout
      router.push(`/personalize/${sessionId}/checkout`);
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to update order details. Please try again.");
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4 flex flex-col items-center border-t border-gray-200 mt-12">
      <h2 className={`${chauPhilomeneOne.className} text-3xl md:text-5xl text-center text-[#3F3C95] uppercase mb-4`}>
        Complete Your Order<br />To Unlock The Full Story
      </h2>
      <p className="text-gray-500 mb-8 font-medium">Choose Cover Format</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
        {/* Softcover Option */}
        <div 
          onClick={() => softcoverRule && setSelectedFormat("SOFTCOVER")}
          className={`flex flex-col items-center p-8 rounded-2xl border-4 transition-all cursor-pointer ${
            !softcoverRule ? "opacity-50 cursor-not-allowed border-gray-200" :
            selectedFormat === "SOFTCOVER" ? "border-[#914A8C] bg-[#914A8C]/5 shadow-lg scale-[1.02]" : "border-gray-200 hover:border-[#914A8C]/50"
          }`}
        >
          <h3 className={`${chauPhilomeneOne.className} text-3xl text-gray-800 uppercase mb-2`}>
            SoftCover
          </h3>
          <div className="text-4xl font-bold text-[#3F3C95]">
            {softcoverRule ? `${currencySymbol}${softcoverRule.price}` : "N/A"}
          </div>
        </div>

        {/* Hardcover Option */}
        <div 
          onClick={() => hardcoverRule && setSelectedFormat("HARDCOVER")}
          className={`flex flex-col items-center p-8 rounded-2xl border-4 transition-all cursor-pointer ${
            !hardcoverRule ? "opacity-50 cursor-not-allowed border-gray-200" :
            selectedFormat === "HARDCOVER" ? "border-[#914A8C] bg-[#914A8C]/5 shadow-lg scale-[1.02]" : "border-gray-200 hover:border-[#914A8C]/50"
          }`}
        >
          <div className="bg-[#FFD54A] text-[#3F3C95] text-xs font-bold px-3 py-1 rounded-full uppercase mb-2">
            Most Popular
          </div>
          <h3 className={`${chauPhilomeneOne.className} text-3xl text-gray-800 uppercase mb-2`}>
            HardCover
          </h3>
          <div className="text-4xl font-bold text-[#3F3C95]">
            {hardcoverRule ? `${currencySymbol}${hardcoverRule.price}` : "N/A"}
          </div>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isUpdating || authLoading}
        className="px-12 py-4 bg-[#FFD54A] hover:bg-[#ffcd2b] text-[#3F3C95] rounded-full font-bold text-xl md:text-2xl uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full max-w-md border-[3px] border-[#3F3C95] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isUpdating ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            Updating...
          </>
        ) : (
          "Continue to Checkout"
        )}
      </button>

      <LoginModal 
        isOpen={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </div>
  );
}
