import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import AttributionCapture from "@/components/AttributionCapture";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Provincia | Roman Colony Builder",
  description:
    "A Roman colony builder on a terrace grid — living water, aqueducts, colonist logistics, and battles. Pre-alpha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AttributionCapture />
        <SiteNav />
        <div className="flex-1">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
