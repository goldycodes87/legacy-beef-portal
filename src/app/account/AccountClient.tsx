'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import type { AccountData, OrderSummary } from '@/lib/account';

const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatusChip({ order }: { order: OrderSummary }) {
  const tone =
    order.status === 'cancelled'
      ? 'bg-gray-100 text-gray-600 border-gray-200'
      : order.status === 'picked_up' || order.status === 'complete'
        ? 'bg-gray-100 text-gray-700 border-gray-200'
        : order.status === 'beef_ready'
          ? 'bg-green-50 text-green-800 border-green-200'
          : order.balanceDue > 0 && order.hangingWeight
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-[#F0F7E8] text-brand-dark border-[#c3dfa0]';

  return (
    <span
      className={`inline-block border rounded-full px-3 py-1 font-body text-xs font-semibold ${tone}`}
    >
      {order.statusLabel}
    </span>
  );
}

/** The money breakdown, the same numbers the balance email quotes. */
function Invoice({ order }: { order: OrderSummary }) {
  const rows: Array<{ label: string; value: string; strong?: boolean }> = [];

  if (order.hangingWeight) {
    rows.push({ label: 'Hanging weight', value: `${order.hangingWeight} lbs` });
    rows.push({ label: 'Price per lb', value: `${money(order.pricePerLb)}/lb` });
    rows.push({ label: 'Total', value: money(order.totalCost) });
  } else {
    rows.push({ label: 'Price per lb', value: `${money(order.pricePerLb)}/lb` });
    rows.push({
      label: 'Total',
      value: 'Set once your beef is weighed',
    });
  }

  if (order.depositPaid > 0) {
    rows.push({ label: 'Deposit paid', value: `−${money(order.depositPaid)}` });
  }
  if (order.discount > 0) {
    rows.push({ label: 'Discount', value: `−${money(order.discount)}` });
  }
  rows.push({
    label: order.balancePaid ? 'Balance' : 'Balance due',
    value: order.balancePaid
      ? 'Paid in full'
      : order.hangingWeight
        ? money(order.balanceDue)
        : 'Due after weighing',
    strong: true,
  });

  return (
    <dl className="mt-4 border-t border-brand-gray-light pt-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0 font-body text-sm"
        >
          <dt className="text-brand-gray">{r.label}</dt>
          <dd
            className={`tabular-nums text-right ${
              r.strong ? 'font-bold text-brand-dark' : 'font-semibold text-brand-dark'
            }`}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const [showInvoice, setShowInvoice] = useState(false);
  const owes = !order.balancePaid && order.balanceDue > 0;

  return (
    <li className="bg-white border border-brand-gray-light rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-xl text-brand-dark">
            {order.purchaseLabel}
            {order.animalType && (
              <span className="font-body font-normal text-brand-gray text-base">
                {' '}
                · {order.animalTypeLabel}
              </span>
            )}
          </h3>
          <p className="font-body text-sm text-brand-gray mt-0.5">
            Butcher date {order.butcherDateLabel}
          </p>
        </div>
        <StatusChip order={order} />
      </div>

      {owes && order.hangingWeight && (
        <p className="font-body text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
          Balance of <strong>{money(order.balanceDue)}</strong> outstanding.
        </p>
      )}

      {showInvoice && <Invoice order={order} />}

      <div className="flex flex-wrap gap-2 mt-4">
        <Link
          href={order.cutSheetComplete ? `/session/${order.id}/review` : `/session/${order.id}/cuts`}
          className="font-body text-sm font-semibold px-4 py-2 rounded-lg border border-brand-gray-light text-brand-dark hover:border-brand-orange transition-colors"
        >
          {order.cutSheetComplete ? 'View cut sheet' : 'Finish cut sheet'}
        </Link>

        <button
          type="button"
          onClick={() => setShowInvoice((v) => !v)}
          aria-expanded={showInvoice}
          className="font-body text-sm font-semibold px-4 py-2 rounded-lg border border-brand-gray-light text-brand-dark hover:border-brand-orange transition-colors"
        >
          {showInvoice ? 'Hide invoice' : 'Invoice'}
        </button>

        {owes ? (
          <Link
            href={`/session/${order.id}/balance`}
            className="font-body text-sm font-semibold px-4 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-hover text-white transition-colors"
          >
            Pay balance
          </Link>
        ) : (
          <Link
            href={`/session/${order.id}`}
            className="font-body text-sm font-semibold px-4 py-2 rounded-lg border border-brand-gray-light text-brand-dark hover:border-brand-orange transition-colors"
          >
            Payments
          </Link>
        )}
      </div>
    </li>
  );
}

export default function AccountClient({ account }: { account: AccountData }) {
  const { firstName, orders, lastOrder } = account;
  const current = orders.filter((o) => !o.isPast && o.status !== 'cancelled');
  const past = orders.filter((o) => o.isPast || o.status === 'cancelled');

  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <SiteNav />

      {/* Welcome */}
      <section className="bg-brand-dark px-4 pt-12 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="font-body text-[#C4A46B] text-xs font-semibold tracking-widest uppercase mb-3">
            Your account
          </p>
          <h1 className="font-display font-black text-white text-3xl sm:text-4xl mb-3">
            Welcome back, {firstName}.
          </h1>
          <p className="font-body text-white/70 max-w-lg">
            {orders.length > 0
              ? 'Everything you have ordered from us is below — your cut sheets, your invoices and your payments.'
              : 'Your orders will show up here once you have placed one.'}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 -mt-8 pb-16">
        {/* Reserve again */}
        <div className="bg-white border border-brand-gray-light rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">
            Ready for another one?
          </h2>
          <p className="font-body text-brand-gray text-sm mb-5 max-w-md">
            {lastOrder
              ? `We have your details saved. Reserving the same as last time — ${lastOrder.purchaseLabel.toLowerCase()}, ${lastOrder.animalTypeLabel.toLowerCase()} — takes about a minute.`
              : 'We have your details saved, so reserving takes about a minute.'}
          </p>
          <Link
            href="/reorder"
            className="inline-block w-full sm:w-auto text-center bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Reserve My Beef →
          </Link>
        </div>

        {/* Order history */}
        <h2 className="font-display font-bold text-2xl text-brand-dark mb-4">Order history</h2>

        {orders.length === 0 && (
          <p className="font-body text-brand-gray bg-white border border-brand-gray-light rounded-2xl p-6">
            Nothing here yet.
          </p>
        )}

        {current.length > 0 && (
          <>
            <h3 className="font-body font-semibold text-brand-gray text-xs uppercase tracking-wider mb-3">
              In progress
            </h3>
            <ul className="space-y-4 mb-10 list-none p-0">
              {current.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </ul>
          </>
        )}

        {past.length > 0 && (
          <>
            <h3 className="font-body font-semibold text-brand-gray text-xs uppercase tracking-wider mb-3">
              Previous orders
            </h3>
            <ul className="space-y-4 list-none p-0">
              {past.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </ul>
          </>
        )}

        <p className="font-body text-brand-gray text-sm text-center mt-10">
          Something not right?{' '}
          <a href="tel:+17192581777" className="text-brand-orange font-semibold">
            Call us at (719) 258-1777
          </a>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
