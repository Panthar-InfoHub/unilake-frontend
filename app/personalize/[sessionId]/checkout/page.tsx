import { Metadata } from "next";
import { getSession } from "@/app/actions/session";
import CheckoutPage from "@/components/checkout/CheckoutPage";
import { redirect } from "next/navigation";
import { isValidSessionId } from "@/app/lib/session-storage";

export const metadata: Metadata = {
  title: "Checkout | UniLake",
  description: "Complete your order to unlock the full story",
};

export default async function CheckoutRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = await params;
  const sessionId = resolvedParams.sessionId;

  if (!isValidSessionId(sessionId)) {
    redirect("/");
  }

  // `redirect()` works by THROWING a NEXT_REDIRECT error, so it must never sit
  // inside a try/catch that swallows errors — the catch would eat the redirect
  // and send everyone to the fallback instead. Scope the error handling tightly
  // to the fetch via .catch(), and keep every redirect() outside it.
  const snapshot = await getSession(sessionId).catch((error) => {
    console.error("Failed to load session for checkout:", error);
    return null;
  });

  if (!snapshot) {
    redirect("/");
  }

  // Already past checkout — send them to the preview page to see the full book.
  // AWAITING_PAYMENT is deliberately allowed through: that is the resume case,
  // where the user closed the Razorpay modal and is coming back to finish.
  if (
    snapshot.status !== "PREVIEW_READY" &&
    snapshot.status !== "AWAITING_PAYMENT" &&
    snapshot.status !== "FAILED"
  ) {
    redirect(`/personalize/${sessionId}/preview`);
  }

  // Must have a coverType picked — checkout prices off it and cannot proceed without it.
  if (!snapshot.coverType) {
    redirect(`/personalize/${sessionId}/preview`);
  }

  return <CheckoutPage sessionId={sessionId} initialSnapshot={snapshot} />;
}
