"use client";

import { usePublicComic } from "@/hooks/usePublicComics";
import { useCountryStore } from "@/stores/useCountryStore";
import { useState } from "react";
import { toast } from "sonner";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import Image from "next/image";

import { SessionSnapshot } from "@/app/types/session";
import { updateSession, attachUser } from "@/app/actions/session";
import { useRouter } from "next/navigation";
import LoginModal from "../checkout/LoginModal";
import { useAuth } from "@/app/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { resolveMrp } from "@/lib/utils";
import { useOrdersPaused } from "@/hooks/useSiteSettings";
import { ORDERS_PAUSED_MESSAGE } from "@/lib/storeStatus";

interface PricingSectionProps {
  comicId: string;
  sessionId: string;
  snapshot: SessionSnapshot;
  /**
   * Preview pages that exhausted every retry and have no finished variant.
   * Non-empty blocks checkout: a customer must not be able to pay for a book
   * with a page that does not exist, and the fix is free — regenerate it.
   */
  failedPageNumbers: number[];
}

export default function PricingSection({
  comicId,
  sessionId,
  snapshot,
  failedPageNumbers,
}: PricingSectionProps) {
  const { data: comicDetail } = usePublicComic(comicId);
  const { selectedCountry, getCurrencySymbol } = useCountryStore();
  const [selectedFormat, setSelectedFormat] = useState<"SOFTCOVER" | "HARDCOVER" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Must be read here, above the early return below — a hook called after a
  // conditional return breaks the rules of hooks.
  const ordersPaused = useOrdersPaused();

  if (!comicDetail) return null;

  // Filter pricing rules for selected country
  const countryPricing = comicDetail.pricingRules.filter(
    (rule) => rule.country.code === selectedCountry?.code
  );

  const softcoverRule = countryPricing.find((r) => r.coverType === "SOFTCOVER");
  const hardcoverRule = countryPricing.find((r) => r.coverType === "HARDCOVER");

  const currencySymbol = getCurrencySymbol();

  /**
   * Price block for one cover option. Returns "N/A" when the comic isn't priced
   * for the selected country, and drops the strike-through line when there is
   * no real discount to show.
   */
  const renderPrice = (rule: typeof softcoverRule) => {
    if (!rule) return <span>N/A</span>;

    const { price, mrp, showMrp } = resolveMrp(rule);

    return (
      <div className="flex flex-col items-center">
        {showMrp && (
          <span className="text-sm font-medium text-gray-500 line-through leading-none mb-1">
            {currencySymbol} {mrp.toLocaleString("en-IN")}
          </span>
        )}
        <span>
          {currencySymbol} {price.toLocaleString("en-IN")}
        </span>
      </div>
    );
  };

  const hasFailedPages = failedPageNumbers.length > 0;

  const handleCheckout = async () => {
    // Store closed — stop here, on this page.
    //
    // Deliberately the FIRST thing in this function, before the cover-type
    // PATCH, before the login modal, before anything touches the network.
    // There is no point saving a format, asking someone to log in, or walking
    // them through an address form for an order that cannot be placed.
    //
    // This is a courtesy, not the enforcement. The backend rejects checkout on
    // its own, so a stale flag here (the public settings query caches for five
    // minutes) can only mean someone gets to the address page and is stopped a
    // step later — never that an order goes through.
    if (ordersPaused) {
      toast.error(ORDERS_PAUSED_MESSAGE);
      return;
    }

    // Guarded here as well as on the disabled button: the button can be
    // re-enabled from devtools, and this is the path to a real payment.
    if (hasFailedPages) {
      toast.error(
        "Some pages could not be created. Please regenerate them before checking out."
      );
      return;
    }

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
    <div className="w-full max-w-3xl mx-auto py-10 px-8 flex flex-col items-center bg-[#FFFFFF] rounded-[40px] border-[4px] border-[#914BBC] shadow-[12px_12px_0px_#403A8B] mt-12 mb-20 relative">
      <h2 className={`${hankenGrotesk.className} text-2xl md:text-3xl text-center text-black font-semibold mb-2`}>
        Complete Your Order To Unlock The Full Story
      </h2>

      <div className="md:hidden font-medium text-sm text-black mb-4 mt-2">
        Choose Cover Format
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full max-w-2xl mb-10 mt-8">
        {/* Softcover Option */}
        <div 
          onClick={() => softcoverRule && setSelectedFormat("SOFTCOVER")}
          className={`flex flex-col items-center p-5 rounded-[30px] transition-all cursor-pointer w-full max-w-[220px] ${
            !softcoverRule ? "opacity-50 cursor-not-allowed border border-gray-200" :
            selectedFormat === "SOFTCOVER" ? "border-[4px] border-[#914BBC] scale-[1.02]" : "border border-black hover:border-gray-500"
          }`}
        >
          <div className="text-[#403A8B] text-lg font-bold mb-1">SoftCover</div>
          <div className="text-black text-xs mb-3 text-center">Flexible & Lightweight</div>
          <div className="relative w-[110px] h-[145px] mb-3">
            <Image 
              src="/assets/home_page/softcover.png" 
              alt="SoftCover" 
              fill
              className="object-contain drop-shadow-md" 
            />
          </div>
          <div className="text-black text-lg font-bold">
            {renderPrice(softcoverRule)}
          </div>
        </div>

        {/* Middle Text */}
        <div className="hidden md:flex flex-col items-center justify-center font-medium text-sm text-black">
          Choose Cover Format
        </div>

        {/* Hardcover Option */}
        <div 
          onClick={() => hardcoverRule && setSelectedFormat("HARDCOVER")}
          className={`flex flex-col items-center p-5 rounded-[30px] transition-all cursor-pointer w-full max-w-[220px] ${
            !hardcoverRule ? "opacity-50 cursor-not-allowed border border-gray-200" :
            selectedFormat === "HARDCOVER" ? "border-[4px] border-[#914BBC] scale-[1.02]" : "border border-black hover:border-gray-500"
          }`}
        >
          <div className="text-[#403A8B] text-lg font-bold mb-1">HardCover</div>
          <div className="text-black text-xs mb-3 text-center">Sturdy & Long Lasting</div>
          <div className="relative w-[110px] h-[145px] mb-3">
            <Image 
              src="/assets/home_page/hardcover.png" 
              alt="HardCover" 
              fill
              className="object-contain drop-shadow-md" 
            />
          </div>
          <div className="text-black text-lg font-bold">
            {renderPrice(hardcoverRule)}
          </div>
        </div>
      </div>

      {hasFailedPages && (
        <div
          className={`${hankenGrotesk.className} w-full max-w-[420px] mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900`}
        >
          <span className="font-bold">
            {failedPageNumbers.length === 1
              ? `Page ${failedPageNumbers[0]} couldn't be created.`
              : `Pages ${failedPageNumbers.join(", ")} couldn't be created.`}
          </span>{" "}
          Scroll up and hit Regenerate on {failedPageNumbers.length === 1 ? "it" : "them"} before checking out.
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isUpdating || authLoading || hasFailedPages}
        className="px-8 py-3 bg-gradient-to-b from-[#5c58c2] to-[#403A8B] hover:from-[#6a66d0] hover:to-[#4a449d] text-white rounded-full font-bold text-sm md:text-base uppercase tracking-wider transition-all w-full max-w-[340px] border-2 border-[#1e1c4a] shadow-[0px_4px_0px_#FFD54A,0px_10px_20px_rgba(64,58,139,0.5)] active:translate-y-[4px] active:shadow-[0px_0px_0px_#FFD54A,0px_4px_10px_rgba(64,58,139,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isUpdating ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            Updating...
          </>
        ) : (
          "CONTIUNE TO CHECKOUT"
        )}
      </button>

      <LoginModal
        isOpen={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </div>
  );
}
