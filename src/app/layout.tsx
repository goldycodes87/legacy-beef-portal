import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.legacylandandcattleco.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Legacy Land & Cattle | Ranch-Direct Beef in Colorado Springs",
    // Pages set their own title; this keeps the brand on the end of it.
    template: "%s | Legacy Land & Cattle",
  },
  description:
    "Whole, half, and quarter beef shares raised on our Black Forest, Colorado ranch and cut exactly how your family eats. Transport, processing, and dry aging included.",
  applicationName: "Legacy Land & Cattle",
  keywords: [
    "grass fed beef Colorado Springs",
    "beef share Colorado",
    "half beef",
    "quarter beef",
    "ranch direct beef",
    "Black Forest Colorado",
  ],
  // The tab icon was a 1.18 MB SVG. These PNGs are under 1 KB for the tab.
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Legacy Land & Cattle",
    url: SITE_URL,
    title: "Legacy Land & Cattle | Ranch-Direct Beef in Colorado Springs",
    description:
      "Whole, half, and quarter beef shares raised on our Black Forest ranch and cut exactly how your family eats.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Legacy Land & Cattle — ranch-direct beef, cut your way",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Legacy Land & Cattle | Ranch-Direct Beef",
    description:
      "Whole, half, and quarter beef shares raised on our Black Forest, Colorado ranch.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "/" },
};

/** Helps Google show the ranch as a local business with real contact details. */
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Legacy Land & Cattle",
  description:
    "Ranch-direct whole, half, and quarter beef shares from Black Forest, Colorado.",
  url: SITE_URL,
  telephone: "+1-719-258-1777",
  email: "orders@legacylandandcattleco.com",
  image: `${SITE_URL}/og-image.png`,
  // Locality only. The street address is given to customers directly rather
  // than published, so it is deliberately absent here too.
  address: {
    "@type": "PostalAddress",
    addressLocality: "Colorado Springs",
    addressRegion: "CO",
    postalCode: "80908",
    addressCountry: "US",
  },
  areaServed: "Colorado Springs, Colorado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Inter:wght@400;500;600&family=Dancing+Script:wght@700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
      </head>
      <body className="min-h-screen bg-white font-body antialiased">
        {children}
      </body>
    </html>
  );
}
