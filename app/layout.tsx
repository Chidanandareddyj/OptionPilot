import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { AuthProvider } from "@/lib/auth/provider";
import { PageLoadingProvider } from "@/app/components/loading-overlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "OptionPilot",
  description: "Options strategies built to withstand any volatility.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${instrumentSerif.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <PageLoadingProvider>{children}</PageLoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
