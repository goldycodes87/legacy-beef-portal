import type { Metadata } from 'next';
import ReturningClient from './ReturningClient';

export const metadata: Metadata = {
  title: 'Welcome back',
  description: 'Sign in with your email to see your orders, cut sheets and invoices.',
};

/**
 * A server component so the form is in the first paint. Reading the expired
 * flag with useSearchParams forced the whole page behind a Suspense boundary,
 * which left it blank until JavaScript loaded.
 */
export default async function ReturningPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  return <ReturningClient expired={expired === '1'} />;
}
