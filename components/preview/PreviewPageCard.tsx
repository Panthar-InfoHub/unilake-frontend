"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { RegenerateResponse, SessionPage } from "@/app/types/session";
import GeneratingPlaceholder from "./GeneratingPlaceholder";
import LockedPageOverlay from "./LockedPageOverlay";
import RegenerateControls from "./RegenerateControls";
import { PublicComicDetailPage } from "@/app/types/comic";

interface PreviewPageCardProps {
  page: SessionPage;
  comicPageMetadata: PublicComicDetailPage | undefined;
  onRegenerate: (pageNumber: number) => Promise<RegenerateResponse | undefined>;
  isGeneratingSession: boolean;
}

export default function PreviewPageCard({
  page,
  comicPageMetadata,
  onRegenerate,
  isGeneratingSession,
}: PreviewPageCardProps) {
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(() => {
    // Start on the newest finished variant, or the first slot if none are done yet.
    const ready = page.variants.filter((v) => v.status === "SD_READY");
    if (ready.length === 0) return 0;
    return Math.max(...ready.map((v) => v.variantIndex));
  });

  // The variant this user just asked for. Set on a successful regenerate, cleared once
  // that variant lands. Only a variant the user personally requested auto-switches —
  // anything else arriving would yank the view away from what they chose to look at.
  const awaitedVariantRef = useRef<number | null>(null);

  const isLocked = !page.isPreviewPage;

  // Every variant is navigable, including ones still generating: a pending variant is
  // exactly what the user wants to see the status of after hitting regenerate.
  const variants = page.variants;
  const activePosition = variants.findIndex((v) => v.variantIndex === activeVariantIndex);
  const canGoPrev = activePosition > 0;
  const canGoNext = activePosition >= 0 && activePosition < variants.length - 1;

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
    toast.success(`Page ${page.pageNumber}: your new version is ready`);
  }, [page.variants, page.pageNumber]);

  const handleRegenerate = async () => {
    const res = await onRegenerate(page.pageNumber);
    if (!res) return;

    // Show the pending slot immediately. It renders as "generating", and the user can
    // arrow back to the original while it works.
    awaitedVariantRef.current = res.variantIndex;
    setActiveVariantIndex(res.variantIndex);
  };

  const step = (direction: -1 | 1) => {
    const next = variants[activePosition + direction];
    if (next) setActiveVariantIndex(next.variantIndex);
  };

  const width = comicPageMetadata?.artworkWidth || 1024;
  const height = comicPageMetadata?.artworkHeight || 1024;
  const aspectRatio = width / height;

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#FFD54A] text-[#3F3C95] " +
    "flex items-center justify-center shadow-md border-2 border-[#3F3C95] transition-all " +
    "hover:brightness-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none";

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto py-12">
      <div className="relative w-full">
        <div
          className="relative w-full rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-slate-100 ring-1 ring-black/5"
          style={{ aspectRatio }}
        >
          {isLocked && <LockedPageOverlay />}

          {!isLocked && isGenerating && <GeneratingPlaceholder />}

          {!isLocked && !isGenerating && imageUrl && (
            <Image
              src={imageUrl}
              alt={`Page ${page.pageNumber}`}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 600px"
              priority={page.pageNumber <= 2}
              // Loaded straight from R2 rather than through /_next/image.
              // These are one-off, per-customer images: the optimizer would
              // re-encode an already web-sized WebP, put our server in the
              // critical path of every page view, and never reuse the cache
              // because no two users share an image.
              unoptimized
            />
          )}
        </div>

        {/* Variant navigation. Hidden entirely on locked pages and whenever there is
            only one version — there is nothing to step through. */}
        {!isLocked && variants.length > 1 && (
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
        {!isLocked && variants.length > 1 && (
          <span className="ml-2 normal-case tracking-normal text-gray-400">
            · version {activePosition + 1} of {variants.length}
          </span>
        )}
      </div>

      {!isLocked && variants.length > 0 && (
        <RegenerateControls
          variants={variants}
          activeVariantIndex={activeVariantIndex}
          onSelectVariant={setActiveVariantIndex}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating || isGeneratingSession}
        />
      )}
    </div>
  );
}
