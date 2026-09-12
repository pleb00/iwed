import type { Metadata } from "next";
import wedding from "@/data/wedding.json";
import "./globals.css";

export const metadata: Metadata = {
  title: `${wedding.couple.bride.name} & ${wedding.couple.groom.name} — The Wedding`,
  description: wedding.copy.invitation,
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
