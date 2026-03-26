import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legacy Land & Cattle | Grass-Fed Beef",
  description: "Premium grass-fed beef direct from Legacy Land & Cattle. Reserve your share of the harvest.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://legacylandandcattleco.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-cream font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
