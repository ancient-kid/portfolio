import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import { CustomCursor } from "./components/CustomCursor";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANRG. — Systems • AI • Engineering",
  description:
    "Building scalable systems integrating intelligence, backend architecture, and interface precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} relative antialiased`}
      >
        <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025] [background-image:radial-gradient(rgba(255,255,255,0.75)_0.5px,transparent_0.5px)] [background-size:2px_2px]" />
        <CustomCursor />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
