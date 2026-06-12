import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://chronolite.com.ng"),
  title: {
    default: "Chronolite | Nigeria's Premium Timepieces",
    template: "%s | Chronolite",
  },
  description:
    "Experience the pinnacle of Nigerian craftsmanship. Shop meticulously curated luxury watches and premium designer timepieces.",
  keywords: [
    "Luxury Watches Nigeria",
    "Chronolite",
    "Designer Watches Lagos",
    "Premium Timepieces Nigeria",
  ],
  authors: [{ name: "Favour Nwajei" }],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://chronolite.com.ng",
    title: "Chronolite | Nigeria's Premium Timepieces",
    description: "Nigeria's most meticulously crafted timepieces and luxury essentials.",
    siteName: "Chronolite",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Chronolite Luxury Watches Nigeria" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chronolite | Luxury Timepieces",
    description: "Craftsmanship excellence in every tick.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#d4af37",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeBootScript = `
(function(){
  try{
    var stored=localStorage.getItem("chronolite-theme");
    var system=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
    var theme=stored==="dark"||stored==="light"?stored:system;
    document.documentElement.setAttribute("data-theme",theme);
  }catch(e){
    document.documentElement.setAttribute("data-theme","light");
  }
})();
`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased text-[var(--foreground)] bg-[var(--background)]">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}