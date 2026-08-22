import Image from "next/image";
import { SessionSnapshot } from "@/app/types/session";
import { usePublicComic } from "@/hooks/usePublicComics";
import { useCountryStore } from "@/stores/useCountryStore";

interface OrderSummaryProps {
  snapshot: SessionSnapshot;
}

export default function OrderSummary({ snapshot }: OrderSummaryProps) {
  const { data: comicDetail } = usePublicComic(snapshot.comicId);
  const { selectedCountry, getCurrencySymbol } = useCountryStore();

  if (!comicDetail) return null;

  const coverUrl = snapshot.comic.coverThumbnailUrls?.[0];
  
  // Find pricing rule
  const countryPricing = comicDetail.pricingRules.filter(
    (rule) => rule.country.code === selectedCountry?.code
  );
  
  const pricingRule = countryPricing.find(
    (r) => r.coverType === snapshot.coverType
  );

  const currencySymbol = getCurrencySymbol();
  const price = pricingRule ? pricingRule.price : "N/A";

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold text-[#3F3C95] mb-6">Order Summary</h2>
      
      <div className="flex gap-4">
        {coverUrl && (
          <div className="relative w-24 h-32 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
            <Image
              src={coverUrl}
              alt="Comic Cover"
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
        
        <div className="flex flex-col justify-between flex-1">
          <div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">{comicDetail.title}</h3>
            <p className="text-gray-500 text-sm mt-1">
              Personalized for <span className="font-semibold text-gray-700">{snapshot.childName || "your child"}</span>
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <span className="px-3 py-1 bg-[#F8E7D2] text-[#914A8C] text-xs font-bold rounded-full uppercase">
              {snapshot.coverType}
            </span>
            <span className="text-2xl font-black text-[#3F3C95]">
              {currencySymbol}{price}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-500 font-medium">
          Your order details cannot be changed after payment.
        </p>
      </div>
    </div>
  );
}
