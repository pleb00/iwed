import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undangan Pribadi",
  description: "Gunakan tautan undangan yang telah dibagikan kepada Anda.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
