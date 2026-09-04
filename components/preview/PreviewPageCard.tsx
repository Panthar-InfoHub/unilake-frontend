"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RegenerateResponse, SessionPage } from "@/app/types/session";
import GeneratingPlaceholder from "./GeneratingPlaceholder";
import LockedPageOverlay from "./LockedPageOverlay";
import RegenerateSlide from "./RegenerateSlide";
import { PublicComicDetailPage } from "@/app/types/comic";

interface PreviewPageCardProps {
  page: SessionPage;
  comicPageMetadata: PublicComicDetailPage | undefined;
  onRegenerate: (pageNumber: number) => Promise<RegenerateResponse | undefined>;
  isGeneratingSession: boolean;
  isPaid?: boolean;
}

export default function PreviewPageCard({
  page,
  comicPageMetadata,
  onRegenerate,
  isGeneratingSession,
  isPaid,
}: PreviewPageCardProps) {
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(() => {
    // Start on the newest finished variant, or the first slot if none are done yet.
    const ready = page.variants.filter((v) => v.status === "SD_READY");
    if (ready.length === 0) return 0;
    return Math.max(...ready.map((v) => v.variantIndex));
  });

  const [showRegenerateSlide, setShowRegenerateSlide] = useState(false);
  const [isLoadingRegenerate, setIsLoadingRegenerate] = useState(false);

  // The variant this user just asked for. Set on a successful regenerate, cleared once
  // that variant lands. Only a variant the user personally requested auto-switches —
  // anything else arriving would yank the view away from what they chose to look at.
  const awaitedVariantRef = useRef<number | null>(null);

  const isLocked = isPaid ? false : !page.isPreviewPage;

  // Every variant is navigable, including ones still generating: a pending variant is
  // exactly what the user wants to see the status of after hitting regenerate.
  const variants = page.variants;
  
  const maxRegenerations = isPaid ? 6 : 3;
  const triesLeft = maxRegenerations - variants.length;

  const activePosition = variants.findIndex((v) => v.variantIndex === activeVariantIndex);
  const canGoPrev = activePosition > 0 || showRegenerateSlide;
  const canGoNextNormal = activePosition >= 0 && activePosition < variants.length - 1;
  const canGoNextToRegenerate = !isLocked && variants.length > 0 && activePosition === variants.length - 1;
  const canGoNext = !showRegenerateSlide && (canGoNextNormal || canGoNextToRegenerate);

  const currentVariant = variants.find((v) => v.variantIndex === activeVariantIndex);
  const isGenerating = !isLocked && currentVariant?.status !== "SD_READY";
  // Prefer the web derivative; fall back to the print master for variants that
  // predate it or whose derivative failed to build.
  const imageUrl =
    !isLocked && currentVariant?.status === "SD_READY"
      ? currentVariant.displayImageUrl ?? currentVariant.finalImageUrl
      : null;

  // Watch for the requested variant finishing, then reveal it.
  useEffect(() => {
    const awaited = awaitedVariantRef.current;
    if (awaited === null) return;

    const variant = page.variants.find((v) => v.variantIndex === awaited);
    if (variant?.status !== "SD_READY") return;

    awaitedVariantRef.current = null;
    setActiveVariantIndex(awaited);
    setShowRegenerateSlide(false);
    toast.success(`Page ${page.pageNumber}: your new version is ready`);
  }, [page.variants, page.pageNumber]);

  const handleRegenerate = async () => {
    if (isLoadingRegenerate) return;
    setIsLoadingRegenerate(true);
    try {
      const res = await onRegenerate(page.pageNumber);
      if (!res) return;

      awaitedVariantRef.current = res.variantIndex;
      setActiveVariantIndex(res.variantIndex);
      setShowRegenerateSlide(false);
    } catch (error) {
      const message = (error as { message?: string } | null)?.message;
      toast.error(message || "Failed to start regeneration");
    } finally {
      setIsLoadingRegenerate(false);
    }
  };

  const step = (direction: -1 | 1) => {
    if (showRegenerateSlide && direction === -1) {
      setShowRegenerateSlide(false);
      const lastVariant = variants[variants.length - 1];
      if (lastVariant) setActiveVariantIndex(lastVariant.variantIndex);
      return;
    }
    
    if (!showRegenerateSlide && direction === 1 && activePosition === variants.length - 1) {
      setShowRegenerateSlide(true);
      return;
    }

    const next = variants[activePosition + direction];
    if (next) {
      setActiveVariantIndex(next.variantIndex);
      setShowRegenerateSlide(false);
    }
  };

  const width = comicPageMetadata?.artworkWidth || 1024;
  const height = comicPageMetadata?.artworkHeight || 1024;
  const aspectRatio = width / height;

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#FFD54A] text-[#3F3C95] " +
    "flex items-center justify-center shadow-md border-2 border-[#3F3C95] transition-all " +
    "hover:brightness-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none";

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto py-4">
      <div className="flex flex-col items-center w-full max-w-[600px]">
        <div className="relative w-full">
          <div
            className="relative w-full rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-slate-100 ring-1 ring-black/5"
            style={
              !isLocked && !showRegenerateSlide && !isGenerating && imageUrl
                ? undefined
                : { aspectRatio }
            }
          >
            {isLocked && <LockedPageOverlay />}

            {!isLocked && showRegenerateSlide && (
              <RegenerateSlide
                onRegenerate={handleRegenerate}
                isLoading={isLoadingRegenerate}
                isGenerating={isGeneratingSession}
                triesLeft={triesLeft}
              />
            )}

            {!isLocked && !showRegenerateSlide && isGenerating && <GeneratingPlaceholder />}

            {!isLocked && !showRegenerateSlide && !isGenerating && imageUrl && (
              <img
                src={imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-auto block"
              />
            )}
          </div>

          {/* Variant navigation */}
          {!isLocked && (variants.length > 1 || canGoNextToRegenerate) && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={!canGoPrev}
                aria-label="Previous version of this page"
                className={`${arrowClass} left-0 -translate-x-1/2`}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={!canGoNext}
                aria-label="Next version of this page"
                className={`${arrowClass} right-0 translate-x-1/2`}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        <div className="mt-4 font-bold text-gray-400 uppercase tracking-widest text-sm">
          Page {page.pageNumber}
          {!isLocked && !showRegenerateSlide && variants.length > 1 && (
            <span className="ml-2 normal-case tracking-normal text-gray-400">
              · version {activePosition + 1} of {variants.length}
            </span>
          )}
        </div>
      </div>

      {!isLocked && variants.length > 0 && (
        <div className="flex flex-row lg:flex-col items-center gap-3 mt-4 lg:mt-0 overflow-x-auto lg:absolute lg:top-12 lg:right-4 w-full lg:w-auto p-2">
          {variants.map((variant) => {
            const isReady = variant.status === "SD_READY";
            const thumbUrl = variant.displayImageUrl ?? variant.finalImageUrl;
            const isActive = !showRegenerateSlide && activeVariantIndex === variant.variantIndex;
            return (
              <button
                key={variant.pageVersionId}
                onClick={() => {
                  setActiveVariantIndex(variant.variantIndex);
                  setShowRegenerateSlide(false);
                }}
                title={isReady ? `Version ${variant.variantIndex + 1}` : "Still generating..."}
                className={`relative w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                  isActive
                    ? "border-[#3F3C95] shadow-sm scale-110 z-10"
                    : "border-transparent hover:border-gray-300 opacity-70 hover:opacity-100"
                }`}
              >
                {isReady && thumbUrl ? (
                  <>
                    <Image
                      src={thumbUrl}
                      alt={`Version ${variant.variantIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                    <div className="absolute bottom-1 right-1 bg-white/90 px-1 rounded text-[10px] font-bold text-[#3F3C95] shadow-sm">
                      V{variant.variantIndex + 1}
                    </div>
                  </>
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
