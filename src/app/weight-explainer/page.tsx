import Image from 'next/image';
import Link from 'next/link';

export default function WeightExplainerPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>
      <main className="max-w-[640px] mx-auto px-4 py-16 text-center">
        <h1
          className="text-3xl font-bold text-brand-dark mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Coming in Block 5
        </h1>
        <p className="text-brand-gray mb-8">
          The weight explainer and booking flow will be built next.
        </p>
        <Link
          href="/select-animal"
          className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          ← Back to Animal Selection
        </Link>
      </main>
    </div>
  );
}
