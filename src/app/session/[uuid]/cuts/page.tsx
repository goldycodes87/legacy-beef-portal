import Link from 'next/link';

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function CutsPage({ params }: PageProps) {
  const { uuid } = await params;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full card text-center">
        <div className="text-5xl mb-4">🔨</div>
        <h1 className="text-2xl font-serif font-bold text-brand-green mb-3">
          Cut Sheet Builder
        </h1>
        <p className="text-gray-600 mb-2">
          <strong>Coming in Block 2!</strong>
        </p>
        <p className="text-gray-500 text-sm mb-6">
          The cut sheet builder is under construction. Soon you&apos;ll be able to specify
          exactly how you want every part of your beef processed — steaks, roasts, ground beef,
          brisket, and more.
        </p>
        <Link href={`/session/${uuid}`} className="btn-secondary">
          ← Back to Your Order
        </Link>
      </div>
    </main>
  );
}
