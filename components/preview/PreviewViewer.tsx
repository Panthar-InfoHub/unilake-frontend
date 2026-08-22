"use client";

import { RegenerateResponse, SessionSnapshot } from "@/app/types/session";
import { usePublicComic } from "@/hooks/usePublicComics";
import PreviewProgress from "./PreviewProgress";
import PreviewPageCard from "./PreviewPageCard";
import PricingSection from "./PricingSection";
import Image from "next/image";
import { ChevronDown, ImageIcon, ArrowLeftRight } from "lucide-react";
import { chauPhilomeneOne } from "@/app/fonts";

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

  return (
    <div className="w-full flex flex-col items-center bg-[#fcf9f2] min-h-screen py-12">
      
      {isGeneratingSession && (
        <PreviewProgress pagesReady={pagesReady} totalPages={totalPreviewPages} />
      )}
      
      {isGeneratingPaid && (
        <PreviewProgress pagesReady={paidPagesReady} totalPages={totalPaidPages} />
      )}

      <div className="w-full max-w-4xl px-4 flex flex-col items-center gap-16">
        
        <div className="text-center mb-8 w-full mt-2 relative z-10 translate-y-20">
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
              />
              <ChevronDown size={32} className="text-gray-300 mt-4" />
            </div>
          );
        })}
      </div>

      {!isPaid ? (
        <PricingSection comicId={snapshot.comicId} sessionId={snapshot.id} snapshot={snapshot} />
      ) : status === "PAID_PAGES_READY" ? (
        <div className="w-full max-w-4xl mx-auto py-16 px-4 flex flex-col items-center border-t border-gray-200 mt-12">
          <button
            onClick={() => {
              import("sonner").then((mod) => mod.toast.info("Coming soon!"));
            }}
            className="px-12 py-4 bg-[#FFD54A] hover:bg-[#ffcd2b] text-[#3F3C95] rounded-full font-bold text-xl md:text-2xl uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full max-w-md border-[3px] border-[#3F3C95]"
          >
            Send to Print
          </button>
        </div>
      ) : null}
      
    </div>
  );
}
