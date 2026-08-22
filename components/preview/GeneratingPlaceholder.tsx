import { chauPhilomeneOne } from "@/app/fonts";

export default function GeneratingPlaceholder() {
  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-8 z-10 rounded-sm">
      <div className="animate-pulse flex flex-col items-center">
        <h3 className={`${chauPhilomeneOne.className} text-4xl sm:text-5xl md:text-6xl text-black uppercase tracking-wider mb-4`}>
          GENERATING...
        </h3>
        <p className="text-[#333333] text-lg sm:text-xl max-w-sm leading-relaxed">
          UniLake stands for an Universal Lake of Ideas
        </p>
      </div>
    </div>
  );
}
