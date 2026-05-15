import type { Metadata } from "next";
import { Cinzel, Manrope } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/components/providers";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Kayal Puthumai Shawarma",
  description: "Premium single-shop shawarma ordering platform with Tamil and English branding."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${manrope.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
