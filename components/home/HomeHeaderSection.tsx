"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AnnouncementBanner from "./AnnouncementBanner";
import Header from "./Header";

export default function HomeHeaderSection() {
  const [bannerHeight, setBannerHeight] = useState(0);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <>
      {isHomePage && <AnnouncementBanner onHeightChange={setBannerHeight} />}
      <Header topOffset={isHomePage ? bannerHeight : 0} />
    </>
  );
}
