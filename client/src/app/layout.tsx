import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers";
import { bodyFont, displayFont } from "./fonts";

export const metadata = {
  title: {
    default: "Chronolite | Premium Watches Nigeria",
    template: "%s | Chronolite"
  },
  description:
    "Shop premium luxury watches in Nigeria. Chronographs, couple watches and designer pieces.",
  openGraph: {
    title: "Chronolite Watches",
    description: "Luxury watches at affordable prices",
    images: ["/logo.png"]
  }
};

export default function RootLayout({ children }) {
  const themeBootScript = `
    (function () {
      try {
        var savedTheme = window.localStorage.getItem("chronolite-theme");
        var theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
        document.documentElement.dataset.theme = theme;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} flex min-h-screen flex-col text-[var(--foreground)] antialiased`}>
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
