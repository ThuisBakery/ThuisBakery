import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Parisienne } from "next/font/google";
import "./globals.css";

/*
  PROTOTYPE ONLY. Design-direction spike for issue #13.

  Type system, reasoned from Jana's menu card:
  - Cormorant Garamond carries display and the italic descriptive lines.
    One serif family in two roles, matching the high-contrast old-style
    face on her card. Permitted because the brand asset names a serif.
  - Geist carries everything functional: prices, forms, allergens, the
    Estimate. A high-contrast serif at 14px on a phone is not readable,
    and this site is judged on a phone.
  - Parisienne appears exactly once, as the wordmark, mirroring the single
    script "Menu" on her card.
*/

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-parisienne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThuisBakery design direction prototype",
  description:
    "Throwaway prototype for issue #13. Three design directions for ThuisBakery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${geist.variable} ${parisienne.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
