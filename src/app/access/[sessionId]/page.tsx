'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AccessPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not verify your email.');
        return;
      }
      // Set access cookie and redirect
      router.push(`/session/${sessionId}/cuts`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-warm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Image
            src="/images/LLC_Logo.svg"
            alt="Legacy Land & Cattle"
            width={120}
            height={55}
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="font-display font-bold text-2xl text-brand-dark mb-2">Access Your Order</h1>
          <p className="text-brand-gray text-sm">Enter the email you used when reserving your beef.</p>
        </div>
        <form onSubmit={handleAccess} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-brand-gray-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Access My Order →'}
          </button>
        </form>
        <p className="text-center text-xs text-brand-gray mt-4">
          Need help? Call Grant at <a href="tel:7194595151" className="text-brand-orange">719.459.5151</a>
        </p>
      </div>
    </div>
  );
}
