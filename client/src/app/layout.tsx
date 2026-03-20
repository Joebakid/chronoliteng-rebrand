import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers";
import { bodyFont, displayFont } from "./fonts";
import { Analytics } from "@vercel/analytics/react";

/**
 * PRODUCTION SEO & ICON METADATA
 * Optimized for WhatsApp, Search Engines, and Mobile Devices.
 */
export const metadata = {
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
  
  // --- ICON CONFIGURATION ---
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
  manifest: "/site.webmanifest",

  // --- OPEN GRAPH (WhatsApp, FB, LinkedIn) ---
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://chronolite.com.ng",
    title: "Chronolite | Nigeria's Premium Timepieces",
    description: "Nigeria's most meticulously crafted timepieces and luxury essentials.",
    siteName: "Chronolite",
    images: [
      {
        // WhatsApp prefers high-quality absolute URLs
        url: "https://chronolite.com.ng/logo.png", 
        width: 1200,
        height: 630,
        alt: "Chronolite Luxury Branding",
      },
    ],
  },

  // --- TWITTER / X ---
  twitter: {
    card: "summary_large_image",
    title: "Chronolite | Luxury Timepieces",
    description: "Craftsmanship excellence in every tick.",
    images: ["https://chronolite.com.ng/logo.png"],
  },

  // --- SEARCH ENGINE CRAWLING ---
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * VIEWPORT & THEME COLOR
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // This makes the mobile browser header color match your gold accent
  themeColor: "#d4af37", 
};

export default function RootLayout({ children }) {
  // Script to prevent "Theme Flash" on page load
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>

      <body className="flex min-h-screen flex-col antialiased text-[var(--foreground)] bg-[var(--background)]">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}