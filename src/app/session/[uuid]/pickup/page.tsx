'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PickupWindow {
  id: string;
  label: string;
  pickup_date: string;
  start_time: string;
  end_time: string;
  appointment_count: number;
  max_slots: number;
}

export default function PickupPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [session, setSession] = useState<any>(null);
  const [windows, setWindows] = useState<PickupWindow[]>([]);
  const [step, setStep] = useState(1);
  const [selectedWindow, setSelectedWindow] = useState<PickupWindow | null>(null);
  const [isAlternate, setIsAlternate] = useState(false);
  const [alternateData, setAlternateData] = useState({
    name: '',
    email: '',
    phone: '',
    waiverSigned: false,
  });

  useEffect(() => {
    const checkAccess = async () => {
      // Check for order_access cookie
      const hasCookie = document.cookie.includes('order_access');
      if (!hasCookie) {
        router.push(`/session/${uuid}`);
        return;
      }

      const res = await fetch(`/api/session/${uuid}`);
      const data = await res.json();
      setSession(data);

      if (data.status !== 'beef_ready') {
        router.push(`/session/${uuid}`);
        return;
      }

      if (data.pickup_appointment) {
        // Show confirmation screen instead
        setStep(99);
        return;
      }

      // Fetch windows
      const winRes = await fetch('/api/pickup-windows');
      const winData = await winRes.json();
      setWindows(winData);
    };
    checkAccess();
  }, [uuid, router]);

  const handleSelectWindow = (window: PickupWindow) => {
    setSelectedWindow(window);
    setStep(2);
  };

  const handleConfirm = async () => {
    const res = await fetch(`/api/pickup/${uuid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        window_id: selectedWindow?.id,
        is_alternate: isAlternate,
        pickup_person_name: isAlternate ? alternateData.name : session.customers.name,
        pickup_person_email: isAlternate ? alternateData.email : session.customers.email,
        pickup_person_phone: isAlternate ? alternateData.phone : session.customers.phone,
        waiver_signed: isAlternate ? alternateData.waiverSigned : true,
      }),
    });

    if (res.ok) {
      router.push(`/session/${uuid}?pickup=scheduled`);
    }
  };

  if (!session) return <div className="text-center py-12">Loading...</div>;

  if (step === 99) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <p className="text-xl font-bold text-gray-900 mb-2">Pickup Scheduled ✓</p>
          <p className="text-gray-600">Your pickup time has been confirmed. See you then!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-2xl mx-auto py-12">
        
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold text-white mb-8">Schedule Your Pickup</h1>
            <div className="space-y-4">
              {windows.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWindow(w)}
                  className="w-full text-left bg-white rounded-lg p-6 hover:shadow-lg transition border-2 border-transparent hover:border-brand-orange"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{new Date(w.pickup_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                      <p className="text-gray-600">{w.start_time} – {w.end_time}</p>
                      <p className="text-brand-orange font-semibold">{w.label}</p>
                    </div>
                    <span className="text-gray-500">{w.appointment_count}/{w.max_slots}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl font-bold text-white mb-8">Who&apos;s Picking Up?</h1>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Name</label>
                  <input type="text" value={session.customers.name} disabled className="w-full px-4 py-2 bg-gray-100 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Email</label>
                  <input type="email" value={session.customers.email} disabled className="w-full px-4 py-2 bg-gray-100 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Phone</label>
                  <input type="tel" value={session.customers.phone} disabled className="w-full px-4 py-2 bg-gray-100 rounded" />
                </div>
              </div>

              {session.is_splitting && (
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAlternate}
                    onChange={(e) => setIsAlternate(e.target.checked)}
                  />
                  <span className="font-semibold text-gray-900">Someone else is picking up my beef</span>
                </label>
              )}

              {isAlternate && (
                <div className="mt-6 space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Pickup Person Name</label>
                    <input
                      type="text"
                      value={alternateData.name}
                      onChange={(e) => setAlternateData({ ...alternateData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Email</label>
                    <input
                      type="email"
                      value={alternateData.email}
                      onChange={(e) => setAlternateData({ ...alternateData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Phone</label>
                    <input
                      type="tel"
                      value={alternateData.phone}
                      onChange={(e) => setAlternateData({ ...alternateData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <label className="flex items-start gap-3 p-3 bg-white border rounded mt-4">
                    <input
                      type="checkbox"
                      checked={alternateData.waiverSigned}
                      onChange={(e) => setAlternateData({ ...alternateData, waiverSigned: e.target.checked })}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-900">I understand that once beef is released to the designated person, Legacy Land &amp; Cattle is not responsible for condition or handling. The pickup person accepts full responsibility upon collection.</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-lg">Next</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-3xl font-bold text-white mb-8">Confirm Pickup</h1>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-xl font-bold text-gray-900">{selectedWindow && new Date(selectedWindow.pickup_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="text-xl font-bold text-gray-900">{selectedWindow?.start_time} – {selectedWindow?.end_time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pickup Person</p>
                  <p className="text-xl font-bold text-gray-900">{isAlternate ? alternateData.name : session.customers.name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg">Back</button>
              <button onClick={handleConfirm} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold">Confirm Pickup</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
