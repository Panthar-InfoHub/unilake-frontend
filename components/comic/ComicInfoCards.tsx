"use client";

import { Baby, Camera, Eye, Truck } from "lucide-react";

export default function ComicInfoCards() {
  const cards = [
    {
      id: 1,
      text: "Perfect for children aged 3 - 7",
      icon: <Baby className="w-5 h-5 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#3F3C95]",
      border: "border-[#3F3C95]",
    },
    {
      id: 2,
      text: "Add your child's photo",
      icon: <Camera className="w-5 h-5 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#D92D73]",
      border: "border-[#D92D73]",
    },
    {
      id: 3,
      text: "Preview the full story before buying",
      icon: <Eye className="w-5 h-5 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#C8942A]",
      border: "border-[#C8942A]",
    },
    {
      id: 4,
      text: "Ships in 7-8 business days",
      icon: <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#3F3C95]",
      border: "border-[#3F3C95]",
    },
  ];

  return (
    <div className="flex flex-col gap-4 mt-8 w-full max-w-[480px]">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`flex items-center gap-4 px-5 py-4 bg-white rounded-[14px] border ${card.border} shadow-sm`}
        >
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${card.iconBg} ring-4 ring-white shadow-sm border border-black/5`}
          >
            {card.icon}
          </div>
          <p className="text-[#333333] font-medium text-base leading-tight">
            {card.text}
          </p>
        </div>
      ))}
    </div>
  );
}
