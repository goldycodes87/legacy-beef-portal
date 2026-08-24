import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How Buying a Beef Share Works',
  description:
    'Hanging weight explained, with a live calculator for what a whole, half, or quarter beef actually costs and how much freezer space it needs.',
  alternates: { canonical: '/weight-explainer' },
  openGraph: {
    title: 'How Buying a Beef Share Works',
    description:
      'Hanging weight explained, with a live calculator for what a whole, half, or quarter beef actually costs.',
    url: '/weight-explainer',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
