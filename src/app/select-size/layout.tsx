import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Whole, Half, or Quarter Beef',
  description:
    'Compare whole, half, and quarter beef shares — price per pound, estimated total, finished cut weight, and how much freezer space each one needs.',
  alternates: { canonical: '/select-size' },
  openGraph: {
    title: 'Whole, Half, or Quarter Beef',
    description: 'Compare shares by price, estimated total, and freezer space.',
    url: '/select-size',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
