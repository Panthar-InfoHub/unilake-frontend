"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { SendToPrintSelection } from "@/app/types/session";
import { useSendToPrint } from "@/hooks/useSendToPrint";
import { clearSession } from "@/app/lib/session-storage";
import LoginModal from "@/components/checkout/LoginModal";
import SendToPrintConfirmModal from "./SendToPrintConfirmModal";

interface SendToPrintSectionProps {
  sessionId: string;
  comicId: string;
  selections: SendToPrintSelection[];
  /** Pages where every variant failed — no SD_READY variant exists to print. */
  blockedPages: number[];
  hasInFlight: boolean;
  pageCountMismatch: boolean;
}

/** "7" | "7 and 12" | "7, 12 and 18" */
function formatPageList(pages: number[]): string {
  if (pages.length === 1) return String(pages[0]);
  return `${pages.slice(0, -1).join(", ")} and ${pages[pages.length - 1]}`;
}

export default function SendToPrintSection({
  sessionId,
  comicId,
  selections,
  blockedPages,
  hasInFlight,
  pageCountMismatch,
}: SendToPrintSectionProps) {
  const router = useRouter();
  const { mutateAsync, isPending } = useSendToPrint(sessionId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Held true through the redirect so the button never flicks back to "ready"
  // between the request resolving and the new route painting.
  const [isRedirecting, setIsRedirecting] = useState(false);

  const busy = isPending || isRedirecting;

  // Order matters: the data problem is unfixable by the user, so it outranks the
  // two they can act on.
  const blockReason = pageCountMismatch
    ? "This book's pages don't match its configured length, so we can't send it to print. Please contact support — we'll sort it out."
    : hasInFlight
      ? "One of your pages is still being created. Hang tight — this only takes a moment."
      : blockedPages.length > 0
        ? `${blockedPages.length === 1 ? "Page" : "Pages"} ${formatPageList(blockedPages)} didn't come out right. Please regenerate ${blockedPages.length === 1 ? "it" : "them"} before sending your book to print.`
        : null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await mutateAsync(selections);

      // The session is finished and locked — drop the local copy so the user
      // isn't pulled back into personalizing a book they've committed to print.
      clearSession(comicId);
      setIsRedirecting(true);
      toast.success("Your book is on its way to print!");
      router.push("/dashboard/orders");
    } catch (err) {
      const { code, message } = (err ?? {}) as { code?: string; message?: string };

      if (code === "UNAUTHORIZED") {
        setConfirmOpen(false);
        setLoginOpen(true);
        return;
      }

      // The session moved underneath us — another tab sent it, or the status
      // drifted. The backend's message is already written for the customer.
      if (code === "CONFLICT") {
        setErrorMessage(message ?? "This book has already been sent to print.");
        return;
      }

      setErrorMessage(message ?? "We couldn't send your book to print. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4 flex flex-col items-center border-t border-gray-200 mt-12">
      {blockReason && (
        <div className="mb-6 flex items-start gap-3 max-w-md w-full rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{blockReason}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setErrorMessage(null);
          setConfirmOpen(true);
        }}
        disabled={!!blockReason || busy}
        className="px-12 py-4 bg-[#FFD54A] text-[#3F3C95] rounded-full font-bold text-xl md:text-2xl uppercase tracking-wider shadow-lg transition-all w-full max-w-md border-[3px] border-[#3F3C95] flex items-center justify-center gap-3 enabled:cursor-pointer enabled:hover:bg-[#ffcd2b] enabled:hover:shadow-xl enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" /> Sending…
          </>
        ) : (
          "Send to Print"
        )}
      </button>

      <SendToPrintConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        isPending={busy}
        pageCount={selections.length}
        errorMessage={errorMessage}
      />

      <LoginModal
        isOpen={loginOpen}
        onOpenChange={setLoginOpen}
        title="Log in to continue"
        description="Your session expired. Please sign in again to send your book to print."
      />
    </div>
  );
}
