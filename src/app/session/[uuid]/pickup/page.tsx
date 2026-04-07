'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

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
        pickup_person_name: isAlternate ? alternateData.name : session.customer.name,
        pickup_person_email: isAlternate ? alternateData.email : session.customer.email,
        pickup_person_phone: isAlternate ? alternateData.phone : session.customer.phone,
        waiver_signed: isAlternate ? alternateData.waiverSigned : true,
      }),
    });

    if (res.ok) {
      router.push(`/session/${uuid}?pickup=scheduled`);
    }
  };

  function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`;
  }

  if (!session) return <div className="text-center py-12">Loading...</div>;

  if (step === 99) {
    return (
      <div className="min-h-screen bg-brand-warm flex flex-col items-center justify-center p-4 text-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={240}
          height={108}
          className="h-40 w-auto mx-auto block mb-4"
        />
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="font-display font-bold text-4xl text-brand-dark mb-3">
          You&apos;re All Set!
        </h1>
        <p className="text-brand-gray text-lg max-w-sm">
          Your pickup is scheduled. We&apos;ll see you soon with your beef!
        </p>
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 max-w-sm w-full">
          <p className="text-brand-gray text-sm">Pickup Address</p>
          <p className="font-bold text-brand-dark mt-1">6105 Burgess Rd</p>
          <p className="text-brand-dark">Colorado Springs, CO 80908</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-warm p-4">
      <div className="flex justify-center pt-8 mb-2">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={240}
          height={108}
          className="h-40 w-auto mx-auto block mb-4"
        />
      </div>

      <p className="text-center text-2xl text-brand-gray mb-2">
        <span className="font-bold text-brand-dark">
          {session?.customer?.name?.split(' ')[0]}
        </span>, your beef is ready! 🎉
      </p>

      {session?.balance_due > 0 && !session?.balance_paid && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6 text-center max-w-2xl mx-auto">
          <p className="font-display font-bold text-xl text-brand-dark mb-1">
            Balance Due: ${session.balance_due.toFixed(2)}
          </p>
          <p className="text-sm text-amber-700">
            Please bring payment to pickup or{' '}
            <a href={`/session/${uuid}/balance`} className="underline font-semibold">
              pay online now
            </a>.
          </p>
        </div>
      )}
      {session?.balance_paid && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6 text-center max-w-2xl mx-auto">
          <p className="font-semibold text-green-700">✓ Balance paid — you&apos;re all set!</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto pb-12">

        {step === 1 && (
          <>
            <div className="text-center mb-10">
              <div className="text-5xl mb-4">🥩</div>
              <h1 className="font-display font-bold text-4xl text-brand-dark mb-3">
                Your Beef is Ready!
              </h1>
              <p className="text-brand-gray text-lg">
                Choose a pickup time that works for you.
              </p>
            </div>

            <p className="text-brand-gray text-center text-base mb-6 leading-relaxed">
              Beef pickup is always a good day! Select the pickup date that works best for you. If something comes up last minute, please call us and we&apos;ll work with you to get your beef.
            </p>

            <div className="space-y-4">
              {windows.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWindow(w)}
                  className="w-full text-left bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all border-2 border-transparent hover:border-brand-orange active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-xl text-brand-dark">
                        {new Date(w.pickup_date + 'T00:00:00').toLocaleDateString(
                          'en-US',
                          { weekday: 'long', month: 'long', day: 'numeric' }
                        )}
                      </p>
                      <p className="text-brand-gray text-base mt-1">
                        {formatTime(w.start_time)} – {formatTime(w.end_time)} MST
                      </p>
                      <p className="text-brand-orange font-semibold text-sm mt-1">
                        {w.label}
                      </p>
                    </div>
                    <span className="text-3xl">→</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-8 bg-brand-green rounded-2xl p-6 text-white text-center">
              <p className="font-display font-bold text-lg mb-1">Pickup Address</p>
              <p className="text-white/80">6105 Burgess Rd</p>
              <p className="text-white/80">Colorado Springs, CO 80908</p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">👋</div>
              <h1 className="font-display font-bold text-3xl text-brand-dark">
                Who&apos;s Picking Up?
              </h1>
              <p className="text-brand-gray mt-2">
                We&apos;ll have your order ready when you arrive.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-display font-semibold text-brand-dark mb-1">Name</label>
                  <input type="text" value={session.customer.name} disabled className="w-full px-4 py-3 bg-brand-gray-pale rounded-xl border border-brand-gray-light text-brand-dark" />
                </div>
                <div>
                  <label className="block text-sm font-display font-semibold text-brand-dark mb-1">Email</label>
                  <input type="email" value={session.customer.email} disabled className="w-full px-4 py-3 bg-brand-gray-pale rounded-xl border border-brand-gray-light text-brand-dark" />
                </div>
                <div>
                  <label className="block text-sm font-display font-semibold text-brand-dark mb-1">Phone</label>
                  <input type="tel" value={session.customer.phone} disabled className="w-full px-4 py-3 bg-brand-gray-pale rounded-xl border border-brand-gray-light text-brand-dark" />
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAlternate}
                  onChange={(e) => setIsAlternate(e.target.checked)}
                />
                <span className="font-semibold text-brand-dark">Someone else is picking up my beef</span>
              </label>

              {isAlternate && (
                <div className="mt-6 space-y-3 p-4 bg-brand-warm border-2 border-brand-green rounded-lg">
                  <div>
                    <label className="block text-sm font-display font-semibold text-brand-dark mb-1">Pickup Person Name</label>
                    <input
                      type="text"
                      value={alternateData.name}
                      onChange={(e) => setAlternateData({ ...alternateData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-brand-gray-light rounded-xl focus:outline-none focus:border-brand-orange text-brand-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-display font-semibold text-brand-dark mb-1">Email</label>
                    <input
                      type="email"
                      value={alternateData.email}
                      onChange={(e) => setAlternateData({ ...alternateData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-brand-gray-light rounded-xl focus:outline-none focus:border-brand-orange text-brand-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-display font-semibold text-brand-dark mb-1">Phone</label>
                    <input
                      type="tel"
                      value={alternateData.phone}
                      onChange={(e) => setAlternateData({ ...alternateData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-brand-gray-light rounded-xl focus:outline-none focus:border-brand-orange text-brand-dark"
                    />
                  </div>
                  <label className="flex items-start gap-3 p-3 bg-white border rounded mt-4">
                    <input
                      type="checkbox"
                      checked={alternateData.waiverSigned}
                      onChange={(e) => setAlternateData({ ...alternateData, waiverSigned: e.target.checked })}
                      className="mt-1"
                    />
                    <span className="text-sm text-brand-dark">I understand that once beef is released to the designated person, Legacy Land &amp; Cattle is not responsible for condition or handling. The pickup person accepts full responsibility upon collection.</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-4 bg-brand-gray text-white rounded-xl font-bold text-lg transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-4 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl font-bold text-lg transition-colors">Next</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">✅</div>
              <h1 className="font-display font-bold text-3xl text-brand-dark">
                Confirm Your Pickup
              </h1>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-brand-gray">Date</p>
                  <p className="text-xl font-bold text-brand-dark">{selectedWindow && new Date(selectedWindow.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-gray">Time</p>
                  <p className="text-xl font-bold text-brand-dark">
                    {formatTime(selectedWindow?.start_time ?? '')} – {formatTime(selectedWindow?.end_time ?? '')} MST
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brand-gray">Pickup Person</p>
                  <p className="text-xl font-bold text-brand-dark">{isAlternate ? alternateData.name : session.customer.name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-4 bg-brand-gray text-white rounded-xl font-bold text-lg transition-colors">Back</button>
              <button onClick={handleConfirm} className="flex-1 px-4 py-4 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl font-bold text-lg transition-colors">Confirm Pickup</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
