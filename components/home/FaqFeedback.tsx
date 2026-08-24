"use client";

import { useState } from "react";
import { hankenGrotesk } from "@/app/fonts";
import { submitPublicFeedback } from "@/app/actions/public";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function FeedbackForm() {
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    
    // Honeypot check
    if (formData.get("website_url")) {
      setIsSuccess(true); // Pretend it worked for bots
      return;
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;

    // Basic phone validation (API doesn't validate this)
    if (phone.replace(/\D/g, '').length < 10 && phone.trim().length > 0) {
      setError("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitPublicFeedback({ name, email, phone, message });
      setIsSuccess(true);
      // Reset form
      e.currentTarget.reset();
    } catch (err: any) {
      setError(err?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ===== Content Section ===== */}
      <section className="bg-[#F8E7D2] pb-24 pt-10 md:pt-16 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">

          {/* ===== Feedback & Suggestion Form ===== */}
          <div className="flex flex-col gap-6">
            {/* Header with purple circle dot */}
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-[#8E4A92] shadow-sm" />
              <h3
                className={`
                  ${hankenGrotesk.className}
                  font-extrabold
                  text-[#000000]
                  text-xl
                  sm:text-2xl
                  uppercase
                  tracking-wide
                `}
              >
                Feedback &amp; Suggestion
              </h3>
            </div>

            {/* Input Box Card */}
            <div
              className="
                bg-white
                rounded-2xl
                p-5
                sm:p-6
                shadow-[0_4px_15px_rgba(0,0,0,0.03)]
                border border-[#E5E7EB]
              "
            >
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className={`${hankenGrotesk.className} font-bold text-xl text-neutral-800 mb-2`}>
                    Thank you for your feedback!
                  </h4>
                  <p className={`${hankenGrotesk.className} text-neutral-600`}>
                    We appreciate your suggestions and will get back to you soon.
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
                    style={{ position: 'absolute', left: '-9999px' }}
                    aria-hidden="true"
                  />

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="sr-only">Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Your Name *"
                        className={`
                          ${hankenGrotesk.className}
                          w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3
                          outline-none focus:ring-2 focus:ring-[#8E4A92]/20 focus:border-[#8E4A92]
                          text-[#222222] placeholder-[#888888] text-sm sm:text-base font-medium
                          transition-all
                        `}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="sr-only">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="Your Email *"
                        className={`
                          ${hankenGrotesk.className}
                          w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3
                          outline-none focus:ring-2 focus:ring-[#8E4A92]/20 focus:border-[#8E4A92]
                          text-[#222222] placeholder-[#888888] text-sm sm:text-base font-medium
                          transition-all
                        `}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="sr-only">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="Phone Number *"
                      className={`
                        ${hankenGrotesk.className}
                        w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3
                        outline-none focus:ring-2 focus:ring-[#8E4A92]/20 focus:border-[#8E4A92]
                        text-[#222222] placeholder-[#888888] text-sm sm:text-base font-medium
                        transition-all
                      `}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="sr-only">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      maxLength={2000}
                      rows={4}
                      placeholder="Write your feedback & Suggestions for our books *"
                      className={`
                        ${hankenGrotesk.className}
                        w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3
                        outline-none focus:ring-2 focus:ring-[#8E4A92]/20 focus:border-[#8E4A92]
                        text-[#222222] placeholder-[#888888] text-sm sm:text-base font-medium
                        resize-none transition-all
                      `}
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
                        <span>Submit Feedback</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
