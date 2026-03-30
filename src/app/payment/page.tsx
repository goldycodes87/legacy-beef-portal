import Image from 'next/image';
import ReservationProgress from '@/components/ReservationProgress';

export const metadata = {
  title: 'Payment | Legacy Land & Cattle',
};

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land &amp; Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>
      <ReservationProgress currentStep="deposit" />
      <main className="max-w-[720px] mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🚧</div>
        <h1
          className="text-3xl md:text-4xl font-bold text-brand-dark mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Payment
        </h1>
        <p className="text-brand-gray text-lg">
          Coming in Block 9
        </p>
        <p className="text-brand-gray text-sm mt-4">
          Your contract has been signed. Deposit payment will be available shortly.
        </p>
      </main>
    </div>
  );
}
