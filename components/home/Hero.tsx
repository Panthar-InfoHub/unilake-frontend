import Image from "next/image";
import { chauPhilomeneOne } from "@/app/fonts";
import { getPublicHeroImages } from "@/app/actions/heroimage";
import { HeroImageSlideshow } from "./HeroImageSlideshow";

export default async function Hero() {
  const heroImages = await getPublicHeroImages();

  return (
    <section className="relative pt-44 lg:pt-40">

      <div className="max-w-7xl mx-auto px-8 pb-20">

        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* LEFT */}

          <div className="relative">

            {/* Decoration */}


            <h1
              className={`${chauPhilomeneOne.className} text-[51px] leading-[1] text-[#37308D] uppercase`}
            >
              Imagine Your Child's{" "}

              <span className="relative inline-block">
                Face

                <Image
                  src="/assets/home_page/crownImg.png"
                  alt="Crown"
                  width={60}
                  height={60}
                  className="
  hidden
  lg:block
  absolute
  -top-7
  -right-11
  w-14
  h-auto
  rotate-[1.85deg]
  pointer-events-none
"
                />
              </span>
            </h1>



            <h2 className="text-[38px] font-bold text-[#F26A2E] mt-2 font-chau">

              When They See Themselves

            </h2>

            <h1 className="text-[51px] leading-[1.02] font-black text-[#37308D] uppercase mt-3 font-chau">

              Inside A
              <br />
              Real Storybook

            </h1>

            <p className="mt-8 text-gray-700 text-xl max-w-lg leading-8 font-bold">

              A personalized storybook crafted around their
              Name, Face and Wildest Imaginations.

            </p>

            <button
              className="
                mt-10
                bg-gradient-to-b from-[#3F3C95] to-[#2B2882]
                text-white
                font-extrabold text-sm md:text-base
                uppercase tracking-wider
                px-8 py-3
                rounded-full
                border-b-[4px] border-[#C8942A]
                shadow-[0_4px_10px_rgba(63,60,149,0.3)]
                transition-all
                hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] cursor-pointer
              "
            >
              EXPLORE COMICS
            </button>

          </div>

          {/* RIGHT */}

          <div className="relative flex justify-center">

            <HeroImageSlideshow
              images={heroImages}
              fallbackSrc="/assets/home_page/boyHeroImg.png"
              width={500}
              height={550}
              className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
            />



          </div>

        </div>

      </div>

    </section>
  );
}
