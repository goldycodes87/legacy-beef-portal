import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reserve Your Beef',
  description: 'Hold your spot on an upcoming butcher date.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
