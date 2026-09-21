"use client";

import { useState } from "react";
import { hankenGrotesk } from "@/app/fonts";
import { submitPublicFeedback } from "@/app/actions/public";
import { getErrorMessage } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FeedbackFormProps {
  /** Copy for the textarea. Differs between the home FAQ block and /contact. */
  messagePlaceholder?: string;
  submitLabel?: string;
  /** Extra classes on the white card wrapper, for per-page spacing. */
  className?: string;
}

const inputClass = `
  ${hankenGrotesk.className}
  w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3
  outline-none focus:ring-2 focus:ring-[#8E4A92]/20 focus:border-[#8E4A92]
  text-[#222222] placeholder-[#888888] text-sm sm:text-base font-medium
  transition-all
`;

/**
 * The shared contact/feedback form. Posts to the same endpoint from both the
 * home page's Feedback & Suggestion block and the /contact page.
 *
 * Extracted from FaqFeedback so the honeypot and success state live in exactly
 * one place — two copies of anti-spam logic would inevitably drift, and only
 * one of them would get fixed.
 *
 * Collects name and message only. Email and phone were deliberately removed —
 * there is no reply channel by design, which is why the success copy below
 * promises nothing back.
 */
export default function FeedbackForm({
  messagePlaceholder = "Write your feedback & Suggestions for our books *",
  submitLabel = "Submit Feedback",
  className = "",
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Captured before the first await: React pools the event and
    // e.currentTarget is null by the time we want to reset the form.
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    if (formData.get("website_url")) {
      setIsSuccess(true); // Pretend it worked for bots
      return;
    }

    const name = formData.get("name") as string;
    const message = formData.get("message") as string;

    try {
      setIsSubmitting(true);
      setError(null);
      await submitPublicFeedback({ name, message });
      setIsSuccess(true);
      form.reset();
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Failed to submit feedback. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`
        bg-white
        rounded-2xl
        p-5
        sm:p-6
        shadow-[0_4px_15px_rgba(0,0,0,0.03)]
        border border-[#E5E7EB]
        ${className}
      `}
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4
            className={`${hankenGrotesk.className} font-bold text-xl text-neutral-800 mb-2`}
          >
            Thank you for your feedback!
          </h4>
          <p className={`${hankenGrotesk.className} text-neutral-600`}>
            We read every message that comes in and use it to make our books
            better.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="mt-6 px-6 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          {/* Honeypot field - hidden from users */}
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px" }}
            aria-hidden="true"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your Name *"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={2000}
              rows={4}
              placeholder={messagePlaceholder}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                bg-[#8E4A92] hover:bg-[#7a3e7e] text-white
                px-8 py-3 rounded-xl font-bold shadow-sm
                transition-colors disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                cursor-pointer
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>{submitLabel}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
