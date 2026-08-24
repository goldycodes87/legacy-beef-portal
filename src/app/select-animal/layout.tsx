import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grass-Fed, Grain-Finished, or Wagyu',
  description:
    'Choose how your beef was raised. Grass-fed for lean, complex flavor; grain-finished for marbling; American Wagyu for exceptional marbling in limited quantities.',
  alternates: { canonical: '/select-animal' },
  openGraph: {
    title: 'Grass-Fed, Grain-Finished, or Wagyu',
    description: 'Choose how your beef was raised on our Black Forest, Colorado ranch.',
    url: '/select-animal',
    // Next replaces the parent openGraph wholesale, so the image must repeat.
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
