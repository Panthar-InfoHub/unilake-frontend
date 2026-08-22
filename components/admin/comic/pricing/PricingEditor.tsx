"use client";

import { useState, useEffect } from "react";
import { ComicDetail, CoverType } from "@/app/types/comic";
import { useUpdatePricing } from "@/hooks/usePricing";
import { useCountries } from "@/hooks/useCountries";
import { PricingGrid, PricingGridValue } from "@/components/admin/comic/create/PricingGrid";
import { Button } from "@/components/ui/button";
import { Loader2, Save, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface PricingEditorProps {
  comic: ComicDetail;
}

export function PricingEditor({ comic }: PricingEditorProps) {
  const { data: countries } = useCountries();
  const { mutateAsync: updatePricing, isPending } = useUpdatePricing();
  
  const [values, setValues] = useState<PricingGridValue[]>([]);
  const [error, setError] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);

  // Initialize values from comic
  useEffect(() => {
    if (comic.pricingRules) {
      const initial: PricingGridValue[] = comic.pricingRules.map(pr => ({
        countryId: pr.countryId,
        coverType: pr.coverType,
        price: pr.price.toString()
      }));
      setValues(initial);
      setIsDirty(false);
    }
  }, [comic.pricingRules]);

  const handleValuesChange = (newValues: PricingGridValue[]) => {
    setValues(newValues);
    setIsDirty(true);
    setError(undefined);
  };

  const handleSave = async () => {
    if (!countries || countries.length === 0) return;

    const requiredCells = countries.length * 2;
    const filledCells = values.filter(v => v.price && parseFloat(v.price) > 0).length;
    
    if (filledCells < requiredCells) {
      setError("All pricing fields must be filled with a value > 0.");
      return;
    }

    try {
      await updatePricing({
        comicId: comic.id,
        pricing: values.map(v => ({
          countryId: v.countryId,
          coverType: v.coverType,
          price: parseFloat(v.price)
        }))
      });
      toast.success("Pricing rules updated successfully");
      setIsDirty(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update pricing");
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Pricing Rules</h2>
          <p className="text-sm text-neutral-500">
            Manage the price for this comic in every supported country.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold shadow-sm px-6"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <PricingGrid 
          values={values} 
          onChange={handleValuesChange} 
          error={error} 
        />
      </div>
    </div>
  );
}
