"use client";

import { useState } from "react";
import AnnouncementBanner from "./AnnouncementBanner";
import Header from "./Header";

export default function HomeHeaderSection() {
  const [bannerHeight, setBannerHeight] = useState(0);

  return (
    <>
      <AnnouncementBanner onHeightChange={setBannerHeight} />
      <Header topOffset={bannerHeight} />
    </>
  );
}
