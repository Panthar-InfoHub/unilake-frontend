import { Lock } from "lucide-react";

export default function LockedPageOverlay() {
  return (
    <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-10 rounded-sm">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-[#3F3C95]">
        <Lock size={32} />
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Locked Page</h3>
      <p className="text-gray-600 text-lg max-w-sm">
        Purchase the comic to see all pages and complete the story.
      </p>
    </div>
  );
}
