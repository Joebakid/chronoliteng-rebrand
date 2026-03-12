import { Roboto_Mono, Roboto_Slab } from "next/font/google";

export const bodyFont = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const displayFont = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});