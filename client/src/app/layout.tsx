import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers";
import { bodyFont, displayFont } from "./fonts";

export const metadata = {
  title: {
    default: "Chronolite | Premium Watches Nigeria",
    template: "%s | Chronolite",
  },
  description:
    "Shop premium luxury watches in Nigeria. Chronographs, couple watches and designer pieces.",
  openGraph: {
    title: "Chronolite Watches",
    description: "Luxury watches at affordable prices",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }) {
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

      <body className="flex min-h-screen flex-col antialiased text-[var(--foreground)]">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}