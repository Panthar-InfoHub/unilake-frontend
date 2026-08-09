import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PublicQueryProvider } from "@/components/providers/PublicQueryProvider";

import {
  geistSans,
  geistMono,
  poppins,
  chauPhilomeneOne,
  hankenGrotesk,
} from "@/app/fonts";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      className={cn(geistSans.variable, geistMono.variable, poppins.variable, chauPhilomeneOne.variable, hankenGrotesk.variable, "font-sans", geist.variable)}
    >
      <body className={`${poppins.className} min-h-screen`}>
        <PublicQueryProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </PublicQueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}