import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🐄</div>
        <h1 className="text-2xl font-serif font-bold text-brand-green mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link href="/" className="btn-primary">
          Go Home →
        </Link>
      </div>
    </main>
  );
}
