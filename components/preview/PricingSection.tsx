"use client";

import { usePublicComic } from "@/hooks/usePublicComics";
import { useCountryStore } from "@/stores/useCountryStore";
import { hankenGrotesk } from "@/app/fonts";
import Image from "next/image";

import { Loader2 } from "lucide-react";
import { resolveMrp } from "@/lib/utils";
import type { CoverFormat } from "@/hooks/useCheckoutFlow";

/**
 * The cover-format selector and checkout call to action.
 *
 * Presentational and fully controlled: the preview page renders this several
 * times down the scroll, so selection, in-flight state and the login modal all
 * live once in useCheckoutFlow rather than inside each copy. Keeping any of
 * that here would mean each block disagreed with the others about what the
 * customer had picked.
 */
interface PricingSectionProps {
  comicId: string;
  /**
   * Preview pages that exhausted every retry and have no finished variant.
   * Non-empty blocks checkout: a customer must not be able to pay for a book
   * with a page that does not exist, and the fix is free — regenerate it.
   */
  failedPageNumbers: number[];
  selectedFormat: CoverFormat | null;
  onSelectFormat: (format: CoverFormat) => void;
  /** Drives the spinner. Shared, so every block reflects one submission. */
  isUpdating: boolean;
  isCheckoutDisabled: boolean;
  onCheckout: () => void;
}

export default function PricingSection({
  comicId,
  failedPageNumbers,
  selectedFormat,
  onSelectFormat,
  isUpdating,
  isCheckoutDisabled,
  onCheckout,
}: PricingSectionProps) {
  const { data: comicDetail } = usePublicComic(comicId);
  const { selectedCountry, getCurrencySymbol } = useCountryStore();

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
          <span className="text-[10px] font-medium text-gray-500 line-through leading-none mb-0.5">
            {currencySymbol} {mrp.toLocaleString("en-IN")}
          </span>
        )}
        <span>
          {currencySymbol} {price.toLocaleString("en-IN")}
        </span>
      </div>
    );
  };

  // Still needed locally for the warning banner below. The checkout guard that
  // used the same value now lives in useCheckoutFlow, which computes it from
  // the same prop.
  const hasFailedPages = failedPageNumbers.length > 0;

  return (
    // max-w-xl (576px) rather than 2xl: at 2xl the two option cards left a wide
    // band of dead space on either side, since the row only needs ~410px. The
    // floor here is the title — "Complete Your Order To Unlock The Full Story"
    // needs roughly 430px at text-xl, so going much below this wraps it to two
    // lines and the card gets taller instead of narrower.
    <div className="w-full max-w-xl mx-auto py-6 px-5 flex flex-col items-center bg-[#FFFFFF] rounded-[28px] border-[4px] border-[#914BBC] shadow-[12px_12px_0px_#403A8B] mt-8 mb-12 relative">
      <h2 className={`${hankenGrotesk.className} text-lg md:text-xl text-center text-black font-semibold mb-1`}>
        Complete Your Order To Unlock The Full Story
      </h2>

      <div className="md:hidden font-medium text-xs text-black mb-2 mt-1">
        Choose Cover Format
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 w-full max-w-lg mb-5 mt-4">
        {/* Softcover Option */}
        <div 
          onClick={() => softcoverRule && onSelectFormat("SOFTCOVER")}
          className={`flex flex-col items-center p-2.5 rounded-[18px] transition-all cursor-pointer w-full max-w-[150px] ${
            !softcoverRule ? "opacity-50 cursor-not-allowed border border-gray-200" :
            selectedFormat === "SOFTCOVER" ? "border-[4px] border-[#914BBC] scale-[1.02]" : "border border-black hover:border-gray-500"
          }`}
        >
          <div className="text-[#403A8B] text-sm font-bold mb-0.5">SoftCover</div>
          <div className="text-black text-[10px] mb-1 text-center leading-tight">Flexible &amp; Lightweight</div>
          <div className="relative w-[68px] h-[88px] mb-1">
            <Image
              src="/assets/home_page/softcover.png"
              alt="SoftCover"
              fill
              className="object-contain drop-shadow-md"
            />
          </div>
          <div className="text-black text-sm font-bold">
            {renderPrice(softcoverRule)}
          </div>
        </div>

        {/* Middle Text */}
        <div className="hidden md:flex flex-col items-center justify-center font-medium text-xs text-black whitespace-nowrap">
          Choose Cover Format
        </div>

        {/* Hardcover Option */}
        <div 
          onClick={() => hardcoverRule && onSelectFormat("HARDCOVER")}
          className={`flex flex-col items-center p-2.5 rounded-[18px] transition-all cursor-pointer w-full max-w-[150px] ${
            !hardcoverRule ? "opacity-50 cursor-not-allowed border border-gray-200" :
            selectedFormat === "HARDCOVER" ? "border-[4px] border-[#914BBC] scale-[1.02]" : "border border-black hover:border-gray-500"
          }`}
        >
          <div className="text-[#403A8B] text-sm font-bold mb-0.5">HardCover</div>
          <div className="text-black text-[10px] mb-1 text-center leading-tight">Sturdy &amp; Long Lasting</div>
          <div className="relative w-[68px] h-[88px] mb-1">
            <Image
              src="/assets/home_page/hardcover.png"
              alt="HardCover"
              fill
              className="object-contain drop-shadow-md"
            />
          </div>
          <div className="text-black text-sm font-bold">
            {renderPrice(hardcoverRule)}
          </div>
        </div>
      </div>

      {hasFailedPages && (
        <div
          className={`${hankenGrotesk.className} w-full max-w-[400px] mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-900`}
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
        onClick={onCheckout}
        disabled={isCheckoutDisabled}
        // Solid #3E419B rather than the old two-stop gradient: a single
        // specified colour cannot be expressed as a gradient without inventing
        // a second shade. Hover uses brightness rather than a hand-picked hex
        // for the same reason — and matches how the personalize form's button
        // handles its hover. Bottom edge and drop shadow are #BF8902 and a
        // tint of the new blue, so nothing purple or yellow is left behind.
        // Narrower button AND larger text pull against each other, so the
        // horizontal padding drops from px-6 to px-5 to buy back the room.
        // whitespace-nowrap is the safety net: at 20 uppercase characters this
        // is close enough to the limit that a narrow viewport could otherwise
        // break "CONTINUE TO CHECKOUT" across two lines, which looks broken in
        // a pill. Narrow this further and the text size has to come back down.
        className="px-5 py-2.5 bg-[#3E419B] hover:brightness-110 text-white rounded-full font-extrabold text-base uppercase tracking-wide whitespace-nowrap transition-all w-full max-w-[260px] border-2 border-[#1e1c4a] shadow-[0px_4px_0px_#BF8902,0px_10px_20px_rgba(62,65,155,0.5)] active:translate-y-[4px] active:shadow-[0px_0px_0px_#BF8902,0px_4px_10px_rgba(62,65,155,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isUpdating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Updating...
          </>
        ) : (
          "CONTINUE TO CHECKOUT"
        )}
      </button>

      {/* No LoginModal here. This component renders several times down the
          preview, and one modal per copy would mount several dialogs for a
          single login. PreviewViewer renders exactly one, driven by the shared
          useCheckoutFlow state. */}
    </div>
  );
}
