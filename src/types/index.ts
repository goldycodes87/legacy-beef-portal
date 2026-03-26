export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Animal {
  id: string;
  name: string;
  type: 'whole' | 'half';
  butcher_date: string;
  estimated_ready_date: string;
  status: 'pending' | 'butchered' | 'ready' | 'delivered';
  hanging_weight_lbs: number;
  price_per_lb: number;
  created_at: string;
}

export interface ButcherSlot {
  id: string;
  animal_id: string;
  slot_type: 'whole' | 'half_a' | 'half_b';
  status: 'available' | 'booked' | 'processing';
  customer_id: string | null;
  created_at: string;
  // Joined
  animal?: Animal;
}

export interface Session {
  id: string;
  customer_id: string;
  slot_id: string;
  animal_id: string;
  purchase_type: 'whole' | 'half';
  status: 'draft' | 'in_progress' | 'complete' | 'locked' | 'processing' | 'beef_ready';
  partner_session_id: string | null;
  partner_email: string | null;
  partner_approved: boolean;
  owner_approved: boolean;
  created_at: string;
  last_saved: string;
  // Joined
  customer?: Customer;
  slot?: ButcherSlot;
  animal?: Animal;
}

export interface Payment {
  id: string;
  session_id: string;
  type: 'deposit' | 'balance';
  method: 'card' | 'echeck' | 'cash' | 'check';
  amount_cents: number;
  surcharge_cents: number;
  status: 'pending' | 'paid' | 'waived';
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  session_id: string;
  type: string;
  channel: 'email' | 'sms';
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
}
