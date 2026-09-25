import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { PwaRegister } from "@/components/pwa";
import { AirlineProvider } from "@/lib/store";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const heading = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading-family",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "AM4 desk",
  description: "Personal route, fleet, fare, and departure companion for Airline Manager 4.",
  applicationName: "AM4 desk",
  appleWebApp: {
    capable: true,
    title: "AM4 desk",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#142820",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${heading.variable} ${mono.variable}`}>
      <body className={`${sans.className} antialiased`}>
        <AirlineProvider>
          <PwaRegister />
          {children}
        </AirlineProvider>
      </body>
    </html>
  );
}
