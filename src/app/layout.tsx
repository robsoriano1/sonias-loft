import type { Metadata } from "next";
import { Instrument_Sans, Fraunces } from "next/font/google";
import { site } from "@/lib/content";
import "./globals.css";

const body = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  // The "soft"/"wonk" axes are what give Fraunces its warm, slightly
  // handmade character instead of reading as a generic serif.
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-display",
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
        className={`${body.variable} ${display.variable} bg-shell text-ink-900 font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
