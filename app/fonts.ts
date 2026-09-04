import {
  Geist,
  Geist_Mono,
  Poppins,
  Chau_Philomene_One,
  Hanken_Grotesk,
  Protest_Strike,
} from "next/font/google";

export const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const chauPhilomeneOne = Chau_Philomene_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-chau-philomene-one",
});

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const protestStrike = Protest_Strike({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-protest-strike",
});