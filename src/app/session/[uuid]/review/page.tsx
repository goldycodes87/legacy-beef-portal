'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ReviewPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  return (
    <div className="min-h-screen bg-brand-warm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="font-display font-bold text-2xl text-brand-dark mb-3">Review &amp; Lock</h1>
        <p className="text-brand-gray mb-6">Review page coming in Block 12B.</p>
        <Link href={`/session/${uuid}/cuts`} className="text-brand-orange font-semibold">
          ← Back to Cut Sheet
        </Link>
      </div>
    </div>
  );
}
