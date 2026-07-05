import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GroeiKompas", template: "%s | GroeiKompas" },
  description: "Formatief voortgangsdashboard voor studenten en docenten",
  icons: {
    icon: "/groeikompas-favicon.png",
    apple: "/groeikompas-favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body>{children}</body></html>;
}
