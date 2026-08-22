import { Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { Variant } from "@/app/types/session";
import { useState } from "react";
import { toast } from "sonner";

interface RegenerateControlsProps {
  variants: Variant[];
  activeVariantIndex: number;
  onSelectVariant: (index: number) => void;
  onRegenerate: () => Promise<void>;
  isGenerating: boolean;
  maxRegenerations?: number;
}

export default function RegenerateControls({
  variants,
  activeVariantIndex,
  onSelectVariant,
  onRegenerate,
  isGenerating,
  maxRegenerations = 3,
}: RegenerateControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const maxTries = maxRegenerations;
  const triesLeft = maxTries - variants.length;

  const handleRegenerate = async () => {
    if (triesLeft <= 0 || isLoading || isGenerating) return;
    
    setIsLoading(true);
    try {
      // No success toast here — the card switches to the pending version immediately,
      // which says it better, and a completion toast follows when the image lands.
      await onRegenerate();
    } catch (error) {
      // The axios interceptor rejects with a normalized { code, message }.
      const message = (error as { message?: string } | null)?.message;
      toast.error(message || "Failed to start regeneration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6 w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={handleRegenerate}
          disabled={triesLeft <= 0 || isLoading || isGenerating}
          className="flex items-center gap-2 px-6 py-2 bg-[#3F3C95] text-white rounded-full font-medium hover:bg-[#3F3C95]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw size={18} className={isLoading || isGenerating ? "animate-spin" : ""} />
          <span>Regenerate</span>
        </button>
        <span className="text-sm text-gray-500 font-medium">
          {triesLeft} {triesLeft === 1 ? "try" : "tries"} left
        </span>
      </div>

      {/* Every version, including one still generating — that pending tile sitting
          beside the finished ones is how the user sees their regeneration in flight. */}
      {variants.length > 1 && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg overflow-x-auto w-full max-w-sm justify-center">
          {variants.map((variant) => {
            const isReady = variant.status === "SD_READY";
            const thumbUrl = variant.displayImageUrl ?? variant.finalImageUrl;
            return (
              <button
                key={variant.pageVersionId}
                onClick={() => onSelectVariant(variant.variantIndex)}
                title={isReady ? `Version ${variant.variantIndex + 1}` : "Still generating..."}
                className={`relative w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                  activeVariantIndex === variant.variantIndex
                    ? "border-[#3F3C95] shadow-sm scale-110"
                    : "border-transparent hover:border-gray-300 opacity-70 hover:opacity-100"
                }`}
              >
                {isReady && thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt={`Version ${variant.variantIndex + 1}`}
                    fill
                    className="object-cover"
                    // Without this the optimizer assumed 100vw and fetched a
                    // full-width copy to fill a 64px tile.
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-gray-100 text-[#3F3C95]">
                    <Loader2 size={18} className="animate-spin" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
