import type { Metadata } from "next";
import "./globals.css";

import {
  geistSans,
  geistMono,
  poppins,
  chauPhilomeneOne,
  hankenGrotesk,
} from "@/app/fonts";

export const metadata: Metadata = {
  title: "UniLake",
  description: "Personalized storybooks for kids",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${poppins.variable}
        ${chauPhilomeneOne.variable}
        ${hankenGrotesk.variable}
      `}
    >
      <body className={`${poppins.className} min-h-screen`}>
        {children}
      </body>
    </html>
  );
}