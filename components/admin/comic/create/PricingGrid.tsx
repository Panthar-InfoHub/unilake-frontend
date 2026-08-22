"use client";

import { useCountries } from "@/hooks/useCountries";
import { CoverType } from "@/app/types/comic";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export interface PricingGridValue {
  countryId: string;
  coverType: CoverType;
  price: string;
}

interface PricingGridProps {
  values: PricingGridValue[];
  onChange: (values: PricingGridValue[]) => void;
  error?: string;
}

export function PricingGrid({ values, onChange, error }: PricingGridProps) {
  const { data: countries, isLoading, error: fetchError } = useCountries();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900">Pricing Rules</h3>
        <Skeleton className="h-48 w-full rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm">
        Failed to load countries for pricing grid.
      </div>
    );
  }

  if (!countries || countries.length === 0) {
    return (
      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center flex flex-col items-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="font-bold text-amber-900 mb-1">No Countries Found</h3>
        <p className="text-sm text-amber-700 mb-4 max-w-sm">
          You must create at least one country in the system before you can set pricing and create a comic.
        </p>
        <Link 
          href="/admin/countries"
          className="text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
        >
          Go to Countries
        </Link>
      </div>
    );
  }

  const getPrice = (countryId: string, coverType: CoverType) => {
    return values.find(v => v.countryId === countryId && v.coverType === coverType)?.price || "";
  };

  const handlePriceChange = (countryId: string, coverType: CoverType, newPrice: string) => {
    // Only allow numbers and one decimal point
    if (newPrice !== "" && !/^\d*\.?\d*$/.test(newPrice)) return;
    
    const existingIndex = values.findIndex(v => v.countryId === countryId && v.coverType === coverType);
    let newValues = [...values];
    
    if (existingIndex >= 0) {
      newValues[existingIndex] = { countryId, coverType, price: newPrice };
    } else {
      newValues.push({ countryId, coverType, price: newPrice });
    }
    
    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          Pricing Rules
          {error && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{error}</span>}
        </h3>
        <p className="text-xs text-neutral-500">All countries and cover types are required.</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Hardcover Price</th>
                <th className="px-4 py-3">Softcover Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {countries.map((country) => (
                <tr key={country.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 bg-neutral-200 rounded overflow-hidden shadow-sm shrink-0">
                        {country.flagUrl && (
                          <img src={country.flagUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 leading-tight">{country.name}</p>
                        <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{country.currencyCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">
                        {country.currencyCode}
                      </span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={getPrice(country.id, CoverType.HARDCOVER)}
                        onChange={(e) => handlePriceChange(country.id, CoverType.HARDCOVER, e.target.value)}
                        className={`pl-12 h-9 rounded-lg bg-white ${
                          !getPrice(country.id, CoverType.HARDCOVER) && error ? "border-red-300 bg-red-50" : ""
                        }`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">
                        {country.currencyCode}
                      </span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={getPrice(country.id, CoverType.SOFTCOVER)}
                        onChange={(e) => handlePriceChange(country.id, CoverType.SOFTCOVER, e.target.value)}
                        className={`pl-12 h-9 rounded-lg bg-white ${
                          !getPrice(country.id, CoverType.SOFTCOVER) && error ? "border-red-300 bg-red-50" : ""
                        }`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
