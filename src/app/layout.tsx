import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const futura = localFont({
  src: [
    { path: "../../public/fonts/FuturaBook.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/FuturaExtraBlack.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-futura",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GEMA Royalties — Deine Tantiemen auf einen Blick",
  description:
    "Lade deine GEMA-Tantiemen hoch und entdecke, welche Plattformen und Songs am meisten einbringen. Powered by exe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body
        className={`${futura.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
