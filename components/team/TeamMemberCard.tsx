"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import TeamMemberSocials from "@/components/team/TeamMemberSocials";
import TeamMemberModal from "@/components/team/TeamMemberModal";
import type { TeamMember } from "@/app/types/teamMember";

interface TeamMemberCardProps {
  member: TeamMember;
}

/**
 * One team member card, rendered on both the homepage (OurTeam) and /team.
 *
 * The card is a fixed aspect-ratio frame, so an unbounded bio used to expand
 * and push the avatar clean out of the artwork. The bio is clamped to three
 * lines; anything longer is read in TeamMemberModal.
 *
 * Both pages rendered an identical copy of this markup before it was extracted
 * here. /team is a server component and this is a client one — that is fine,
 * TeamMember is plain JSON and crosses the boundary without trouble.
 */
export default function TeamMemberCard({ member }: TeamMemberCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // "Read more" is only honest when the clamp actually cut something off, so
  // this is measured rather than guessed from the string length.
  const bioRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = bioRef.current;
    if (!el) {
      setIsTruncated(false);
      return;
    }

    // The +1 absorbs sub-pixel rounding. Without it some zoom levels report a
    // 1px overflow on text that is not clamped, and every card grows a
    // "Read more" that opens a modal showing the same text.
    const measure = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);

    measure();

    let cancelled = false;

    // next/font swaps the real webfont in after hydration. Measuring against
    // fallback metrics gives a wrong answer that never self-corrects, because
    // line-clamp pins clientHeight — the swap moves scrollHeight only, which
    // the observer below does not report.
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    // The card's width changes with the responsive grid, both at breakpoints
    // and on reflow, so observe the element rather than listening on window.
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [member.description]);

  return (
    <div className="flex justify-center">
      {/* Card with Exact Custom Background Frame PNG */}
      <div className="relative w-full max-w-[340px] aspect-[445/630] flex flex-col items-center text-center p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] group drop-shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
        {/* Card Background Frame PNG */}
        <Image
          src="/assets/home_page/teamCardFrame.png"
          alt="Card Background"
          fill
          className="pointer-events-none select-none z-0 object-contain"
          priority
        />

        {/* Card Content Container.
            overflow-hidden + min-h-0 are a backstop: the clamp is the real fix,
            but this guarantees nothing can escape the fixed-aspect frame again
            if another field is added later without a height bound. */}
        {/* justify-center balances the leftover height above and below the
            stack instead of letting it all pool at one end, now that the
            social row no longer pushes itself to the bottom. */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full py-5 overflow-hidden min-h-0">
          {/* Team Member Avatar.
              Sized down from 170/190 to make room for the "Read more" button:
              the frame is a fixed aspect ratio, so every pixel this row adds is
              a pixel taken off the social icons at the bottom. */}
          <div className="relative w-full aspect-square max-w-[140px] sm:max-w-[155px] mb-3 rounded-full overflow-hidden flex items-center justify-center bg-[#914B8C]/10 border-2 border-white shadow-sm shrink-0">
            {member.imageUrl ? (
              <Image
                src={member.imageUrl}
                alt={member.name}
                fill
                sizes="155px"
                className="object-cover"
                priority
              />
            ) : (
              <span
                className={`${chauPhilomeneOne.className} text-[#914B8C] text-5xl uppercase`}
              >
                {member.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Name */}
          <h4
            className={`${hankenGrotesk.className} text-[#914B8C] font-extrabold text-xl sm:text-2xl mb-1`}
          >
            {member.name}
          </h4>

          {/* Role */}
          <span
            className={`${hankenGrotesk.className} text-[#000000] font-bold text-sm sm:text-base mb-2 block`}
          >
            ({member.role})
          </span>

          {/* Description — clamped to 3 lines, with the overflow read in the modal */}
          {member.description && (
            <div className="w-full max-w-[250px] mb-2">
              <p
                ref={bioRef}
                className={`${hankenGrotesk.className} text-[#555555] text-xs sm:text-sm font-medium leading-relaxed line-clamp-3`}
              >
                {member.description}
              </p>

              {isTruncated && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`${hankenGrotesk.className} mt-2 text-xs font-bold text-[#914B8C] hover:underline cursor-pointer`}
                >
                  Read more
                </button>
              )}
            </div>
          )}

          {/* Social Links — renders nothing when the member has none.
              A fixed mt-4 rather than mt-auto: mt-auto pinned this row to the
              bottom of the frame, so every pixel of spare height collected into
              one gap under "Read more". shrink-0 keeps the row from being
              compressed away when a long name or role pushes the stack. */}
          <TeamMemberSocials member={member} className="mt-4 pb-1 shrink-0" />
        </div>
      </div>

      <TeamMemberModal
        member={member}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
