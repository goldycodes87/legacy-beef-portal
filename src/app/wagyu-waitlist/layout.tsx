import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'American Wagyu Waitlist',
  description:
    'Join the waitlist for our American Wagyu — 50% Japanese Wagyu crossed with Black Angus, raised in Black Forest, Colorado. Limited availability each season.',
  alternates: { canonical: '/wagyu-waitlist' },
  openGraph: {
    title: 'American Wagyu Waitlist',
    description: '50% Japanese Wagyu × Black Angus, raised in Black Forest, Colorado.',
    url: '/wagyu-waitlist',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
