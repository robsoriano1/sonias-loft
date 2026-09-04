import type { Metadata } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import { site } from "@/lib/content";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} - ${site.location}`,
  description: site.description,
  // TODO: IMAGE REPLACEMENT -> path comes from src/lib/content.ts (site.favicon)
  icons: { icon: site.favicon },
  openGraph: {
    title: `${site.name} - ${site.location}`,
    description: site.description,
    type: "website",
    // TODO: IMAGE REPLACEMENT -> /public/images/og-image.jpg (16:9 link preview)
    images: ["/images/og-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${jost.variable} ${cormorant.variable} bg-shell text-ink-900 font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
