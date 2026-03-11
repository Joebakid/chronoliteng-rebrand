"use client";
import AppProvider from "./state/provider";

export default function Providers({ children }) {
  return <AppProvider>{children}</AppProvider>;
}
