"use client";

import { useCallback, useMemo, useState } from "react";
import {
  RegenerateResponse,
  SendToPrintSelection,
  SessionPage,
  SessionSnapshot,
} from "@/app/types/session";
import { usePublicComic } from "@/hooks/usePublicComics";
import PreviewProgress from "./PreviewProgress";
import PreviewPageCard from "./PreviewPageCard";
import PricingSection from "./PricingSection";
import SendToPrintSection from "./SendToPrintSection";
import Image from "next/image";
import { ChevronDown, ImageIcon, ArrowLeftRight } from "lucide-react";
import { chauPhilomeneOne } from "@/app/fonts";

/** Highest variantIndex that has actually finished, or null if none have. */
function newestReadyIndex(page: SessionPage): number | null {
  const ready = page.variants.filter((v) => v.status === "SD_READY");
  if (ready.length === 0) return null;
  return Math.max(...ready.map((v) => v.variantIndex));
}

interface PreviewViewerProps {
  snapshot: SessionSnapshot;
  status: string;
  pagesReady: number;
  /** Denominator for progress: /generate's jobsEnqueued, or the snapshot's own
   *  preview-page count once that in-memory value is lost to a refresh. */
  totalPreviewPages: number;
  onRegenerate: (pageNumber: number) => Promise<RegenerateResponse | undefined>;
  isPaid?: boolean;
  paidPagesReady?: number;
  totalPaidPages?: number;
}

export default function PreviewViewer({
  snapshot,
  status,
  pagesReady,
  totalPreviewPages,
  onRegenerate,
  isPaid,
  paidPagesReady = 0,
  totalPaidPages = 0,
}: PreviewViewerProps) {
  const { data: comicDetail } = usePublicComic(snapshot.comicId);

  const isGeneratingSession = status === "GENERATING_PREVIEW";
  const isGeneratingPaid = status === "GENERATING_PAID";

  const coverUrl = snapshot.comic.coverThumbnailUrls?.[0];

  // Only the pages the user has deliberately navigated. Everything else falls
  // back to the newest finished variant, so variants arriving over the socket
  // surface on their own without ever overwriting a deliberate pick.
  const [overrides, setOverrides] = useState<Map<number, number>>(() => new Map());

  // Stable — PreviewPageCard lists it in an effect's dependencies.
  const handleVariantChange = useCallback((pageNumber: number, variantIndex: number) => {
    setOverrides((prev) => new Map(prev).set(pageNumber, variantIndex));
  }, []);

  // What a card renders. Honours the override even when it points at a variant
  // that is still generating — watching a regeneration land is the whole reason
  // pending variants are navigable.
  const displayIndex = (page: SessionPage): number | null =>
    overrides.get(page.pageNumber) ?? newestReadyIndex(page);

  const { selections, blockedPages, hasInFlight } = useMemo(() => {
    const sel: SendToPrintSelection[] = [];
    const blocked: number[] = [];
    let inFlight = false;

    for (const page of snapshot.pages) {
      // Mirrors the backend's own in-flight rejection: anything not yet settled.
      if (page.variants.some((v) => v.status !== "SD_READY" && v.status !== "FAILED")) {
        inFlight = true;
      }

      // Unlike displayIndex, this never resolves to an unfinished variant — the
      // backend rejects any selection that isn't SD_READY.
      const override = overrides.get(page.pageNumber);
      const index =
        override !== undefined &&
        page.variants.some((v) => v.variantIndex === override && v.status === "SD_READY")
          ? override
          : newestReadyIndex(page);

      if (index === null) blocked.push(page.pageNumber);
      else sel.push({ pageNumber: page.pageNumber, variantIndex: index });
    }

    return { selections: sel, blockedPages: blocked, hasInFlight: inFlight };
  }, [snapshot.pages, overrides]);

  // The backend requires exactly one selection per Comic.pageCount. If an admin
  // created fewer Page rows than pageCount, send-to-print can never succeed and
  // no amount of regenerating fixes it. Undefined while the comic is loading.
  const pageCountMismatch =
    comicDetail !== undefined && snapshot.pages.length !== comicDetail.pageCount;

  return (
    <div className="w-full flex flex-col items-center bg-[#F1E0CA] min-h-screen py-12">
      
      {isGeneratingSession && (
        <PreviewProgress pagesReady={pagesReady} totalPages={totalPreviewPages} />
      )}
      
      {isGeneratingPaid && (
        <PreviewProgress pagesReady={paidPagesReady} totalPages={totalPaidPages} />
      )}

      <div className="w-full max-w-4xl px-4 flex flex-col items-center gap-4">
        
        <div className="text-center mb-8 w-full mt-20 relative z-10">
          <h2 className={`${chauPhilomeneOne.className} text-2xl md:text-4xl text-[#3F3C95]`}>
            {isPaid ? "Your Complete Storybook" : `Preview for ${snapshot.childName || "Your Child"}`}
          </h2>
          <div className="mt-4 flex flex-col items-center gap-2 text-gray-500 text-sm md:text-base font-medium">
            <span className="flex items-center gap-2">
              <ImageIcon size={18} className="text-[#3F3C95]" /> Watch the story come alive one page at a time!
            </span>
            <span className="flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-[#3F3C95]" /> Slide left or right to pick the best image
            </span>
          </div>
        </div>

        {/* Cover Page */}
        {/* {coverUrl && (
          <div className="flex flex-col items-center w-full max-w-[800px] mx-auto py-12">
            <div className="relative w-full rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-slate-100 ring-1 ring-black/5 aspect-[427/310]">
              <Image
                src={coverUrl}
                alt="Cover Page"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
              />
            </div>
            <div className="mt-4 font-bold text-gray-400 uppercase tracking-widest text-sm">
              Cover Page
            </div>
            <ChevronDown size={32} className="text-gray-300 mt-8 animate-bounce" />
          </div>
        )} */}

        {/* All Pages */}
        {snapshot.pages.map((page) => {
          const comicPageMetadata = comicDetail?.pages.find(p => p.pageNumber === page.pageNumber);
          return (
            <div key={page.pageId} className="w-full flex flex-col items-center">
              <PreviewPageCard
                page={page}
                comicPageMetadata={comicPageMetadata}
                onRegenerate={onRegenerate}
                isGeneratingSession={isGeneratingSession || isGeneratingPaid}
                isPaid={isPaid}
                selectedVariantIndex={displayIndex(page)}
                onVariantChange={handleVariantChange}
              />
              <ChevronDown size={32} className="text-gray-300 mt-4" />
            </div>
          );
        })}
      </div>

      {!isPaid ? (
        <PricingSection comicId={snapshot.comicId} sessionId={snapshot.id} snapshot={snapshot} />
      ) : status === "PAID_PAGES_READY" ? (
        <SendToPrintSection
          sessionId={snapshot.id}
          comicId={snapshot.comicId}
          selections={selections}
          blockedPages={blockedPages}
          hasInFlight={hasInFlight}
          pageCountMismatch={pageCountMismatch}
        />
      ) : null}
      
    </div>
  );
}
