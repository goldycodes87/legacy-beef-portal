'use client';

import { useEffect, useState } from 'react';

interface SessionRow {
  id: string;
  purchase_type: string;
  status: string;
  price_per_lb: number;
  is_splitting: boolean;
  group_role: string;
  group_id: string | null;
  group_size: number;
  created_at: string;
  partner_confirmed: boolean;
  customers: { id: string; name: string; email: string } | null;
  animals: { id: string; name: string; butcher_date: string } | null;
}

export default function SlotsAdminPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/slots')
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load sessions');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reservations Admin</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Animal</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Price/lb</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="font-medium text-gray-900">
                        {session.customers?.name || '—'}
                      </span>
                      {session.is_splitting && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          {session.group_role === 'owner' ? 'Split Owner' : 'Split Partner'}
                        </span>
                      )}
                      {session.is_splitting && session.group_role === 'owner' && !session.partner_confirmed && (
                        <span className="ml-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                          Partner Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{session.customers?.email || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {session.animals?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 capitalize">
                    {session.purchase_type}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${
                      session.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      session.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      session.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    ${session.price_per_lb?.toFixed(2) || '—'}/lb
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(session.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
