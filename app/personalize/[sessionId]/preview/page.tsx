"use client";

import { use, useEffect, useState } from "react";
import { useSessionPreview } from "@/hooks/useSessionPreview";
import PreviewViewer from "@/components/preview/PreviewViewer";
import ComicPreloader from "@/components/comic/ComicPreloader";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearSession, isValidSessionId, consumeShowPreloader, getSessionBySessionId } from "@/app/lib/session-storage";

function PreviewErrorState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-[#3F3C95] mb-4">{title}</h2>
      <p className="text-gray-600 mb-8">{message}</p>
      <button
        onClick={onAction}
        className="px-8 py-3 bg-[#3F3C95] text-white rounded-full font-medium hover:bg-[#3F3C95]/90 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default function PreviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  // The ID comes off the URL, so it can be anything. A malformed one 500s on the server
  // rather than 404ing (§13.1), so screen it here and never make the call at all.
  const sessionIdIsValid = isValidSessionId(resolvedParams.sessionId);
  const sessionId = sessionIdIsValid ? resolvedParams.sessionId : null;

  const [showPreloader, setShowPreloader] = useState(() => {
    return sessionIdIsValid ? consumeShowPreloader(resolvedParams.sessionId) : false;
  });

  const childNameFromStorage = sessionIdIsValid
    ? getSessionBySessionId(resolvedParams.sessionId)?.childName ?? ""
    : "";

  const {
    snapshot,
    isLoading,
    error,
    status,
    pagesReady,
    totalPreviewPages,
    hasNoPreviewPages,
    isExpired,
    isPaid,
    paidPagesReady,
    totalPaidPages,
    triggerGeneration,
    regeneratePage,
  } = useSessionPreview(sessionId);

  // Automatically trigger generation if we just arrived with PHOTO_UPLOADED status.
  // Deliberately NOT depending on `snapshot`: it is a new object on every refetch, so
  // depending on it re-ran this effect constantly. `status` is a primitive derived from
  // it, and the hook itself guarantees /generate is only ever called once per session.
  useEffect(() => {
    if (status !== "PHOTO_UPLOADED") return;
    // Generation is a one-way door (§13.10). Don't walk through it for a comic that has
    // nothing to generate, or for a session whose socket will never connect.
    if (hasNoPreviewPages || isExpired) return;

    triggerGeneration().catch((err) => {
      console.error("Failed to auto-trigger generation:", err);
      toast.error(
        "We couldn't start creating your preview. Please refresh the page to try again."
      );
    });
  }, [status, hasNoPreviewPages, isExpired, triggerGeneration]);

  const handleStartAgain = () => {
    if (snapshot?.comicId) {
      clearSession(snapshot.comicId);
      router.push(`/comic/${snapshot.comicId}`);
    } else {
      router.push("/");
    }
  };

  const renderBody = () => {
    if (showPreloader) {
      return (
        <ComicPreloader
          childName={childNameFromStorage}
          onComplete={() => setShowPreloader(false)}
        />
      );
    }

    if (!sessionIdIsValid) {
      return (
        <PreviewErrorState
          title="This link isn't valid"
          message="That preview link looks incomplete or damaged. Please start again from the comic page."
          actionLabel="Browse Comics"
          onAction={() => router.push("/")}
        />
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-12 h-12 text-[#3F3C95] animate-spin mb-4" />
          <p className="text-xl text-[#3F3C95] font-medium">Loading session...</p>
        </div>
      );
    }

    // Only a total absence of data is fatal. TanStack keeps `error` populated
    // after a failed *background* refetch while `data` stays perfectly valid, so
    // testing `error` here would throw away a working preview every time a poll
    // or a tab-focus refetch blipped. Transient trouble is surfaced as a banner
    // below instead.
    if (!snapshot) {
      return (
        <PreviewErrorState
          title="Oops!"
          message="We couldn't load your session. It may have expired."
          actionLabel="Start Again"
          onAction={handleStartAgain}
        />
      );
    }

    // Checked before anything else about the session, because everything downstream —
    // live updates, regeneration — depends on a socket that will now be refused (§1.2).
    if (isExpired) {
      return (
        <PreviewErrorState
          title="This preview has expired"
          message="Previews are kept for 24 hours. Please personalize your comic again — it only takes a moment."
          actionLabel="Start Again"
          onAction={handleStartAgain}
        />
      );
    }

    // Nothing was ever flagged as a free preview page, so no image will ever arrive.
    if (hasNoPreviewPages) {
      return (
        <PreviewErrorState
          title="This comic isn't ready yet"
          message="We can't generate a preview for this comic right now. Please contact support or try a different story."
          actionLabel="Browse Comics"
          onAction={() => router.push("/")}
        />
      );
    }
    
    // Payment specific routing
    if (status === "AWAITING_PAYMENT") {
      return (
        <PreviewErrorState
          title="Payment Required"
          message="Please complete your payment to continue generating the full comic."
          actionLabel="Complete Payment"
          onAction={() => router.push(`/personalize/${sessionId}/checkout`)}
        />
      );
    }
    
    if (status === "CONFIRMED") {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#3F3C95] mb-4">Your order is confirmed!</h2>
          <p className="text-gray-600 mb-8">We've received your order and are preparing it for print. You'll receive an email with shipping updates soon.</p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-[#3F3C95] text-white rounded-full font-medium hover:bg-[#3F3C95]/90 transition-colors"
          >
            Return Home
          </button>
        </div>
      );
    }
    
    if (status === "FAILED" && !isExpired) {
      return (
        <PreviewErrorState
          title="Something went wrong"
          message="There was an issue with your payment. Please contact support."
          actionLabel="Contact Support"
          onAction={() => window.location.href = "mailto:support@unilake.com"}
        />
      );
    }

    return (
      <>
        {/* Data is still good — we just couldn't reach the server on the last
            refresh. Say so quietly rather than replacing the whole preview. */}
        {error && (
          <div className="w-full max-w-2xl mx-auto mt-4 px-4">
            <div className="flex items-center justify-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
              <Loader2 size={14} className="animate-spin" />
              Having trouble reaching the server — retrying...
            </div>
          </div>
        )}
        <PreviewViewer
          snapshot={snapshot}
          status={status}
          pagesReady={pagesReady}
          totalPreviewPages={totalPreviewPages}
          onRegenerate={regeneratePage}
          isPaid={isPaid}
          paidPagesReady={paidPagesReady}
          totalPaidPages={totalPaidPages}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F1E0CA] flex flex-col">
      <HomeHeaderSection />
      <main className="grow flex flex-col items-center justify-center">{renderBody()}</main>
      <Footer />
    </div>
  );
}
