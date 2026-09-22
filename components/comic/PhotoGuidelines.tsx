"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X, Image as ImageIcon } from "lucide-react";

/**
 * Example shots for the guidance panel.
 * Same data as in components/personalize/NewPhotoForm.tsx — if a photo is
 * added or renamed there, update this list too.
 */
const PHOTO_EXAMPLES: { file: string; label: string; good: boolean }[] = [
  { file: "smiling.png", label: "Smiling", good: true },
  { file: "happy.png", label: "Happy", good: true },
  { file: "detailed.png", label: "Detailed", good: true },
  { file: "hats.png", label: "Hats", good: false },
  { file: "expressions.png", label: "Expressions", good: false },
  { file: "Distant.png", label: "Distant", good: false },
];

/**
 * Static photo-upload guidance displayed on the comic detail page.
 *
 * Shows the same rules and example photos that appear on the re-upload page
 * (NewPhotoForm), so users know what kind of photo to prepare before they
 * start the personalization form.
 */
export default function PhotoGuidelines() {
  // Track example images that failed to load so we show a neutral placeholder
  // instead of a broken-image icon.
  const [missingExamples, setMissingExamples] = useState<Set<string>>(
    new Set()
  );

  return (
    <div className="mt-5 w-full bg-white rounded-[14px] border border-[#3F3C95] shadow-sm p-4">
      <h3 className="text-sm font-bold text-[#3F3C95] mb-2">
        Photo Guidelines
      </h3>

      {/* Text rules */}
      <ul className="list-disc list-inside space-y-0.5 text-xs text-[#333] mb-3">
        <li>No one else should be in the picture</li>
        <li>Child should be facing the camera</li>
        <li>Face &amp; hair should not touch the edges</li>
        <li>Hands or objects should not obstruct the face</li>
      </ul>

      {/* Example photo grid — 3 good, 3 bad */}
      <div className="grid grid-cols-3 gap-2">
        {PHOTO_EXAMPLES.map((example) => (
          <figure key={example.file} className="relative">
            <div className="relative aspect-square rounded-lg overflow-hidden border border-[#3F3C95]/20 bg-neutral-100">
              {missingExamples.has(example.file) ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-neutral-300" />
                </div>
              ) : (
                <Image
                  src={`/assets/Reupload/${example.file}`}
                  alt={example.label}
                  fill
                  sizes="(max-width: 1024px) 30vw, 140px"
                  className="object-cover"
                  onError={() =>
                    setMissingExamples((prev) =>
                      new Set(prev).add(example.file)
                    )
                  }
                />
              )}
            </div>
            <figcaption
              className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white ${
                example.good ? "bg-emerald-600" : "bg-red-500"
              }`}
            >
              {example.good ? <Check size={10} /> : <X size={10} />}
              {example.label}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="text-[10px] text-[#777] mt-2">
        * All photos are kept confidential and used only for creating your
        personalized book panels.
      </p>
    </div>
  );
}
