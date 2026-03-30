import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function purchaseTypeLabel(type: string): string {
  switch (type) {
    case 'whole':   return 'Whole Beef';
    case 'half':    return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default:        return type;
  }
}

function depositForType(type: string): number {
  switch (type) {
    case 'whole':   return 850;
    case 'half':    return 500;
    case 'quarter': return 250;
    default:        return 500;
  }
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

async function generateContractPdf(params: {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  animal: {
    name: string;
    butcher_date: string | null;
    estimated_ready_date: string | null;
    price_per_lb: number;
  };
  purchaseType: string;
  depositAmount: number;
  signature: string;
  ipAddress: string;
  contractVersion: string;
  sessionId: string;
  signedAt: string;
}): Promise<Buffer> {
  // Dynamic import to avoid SSR issues
  const PDFDocument = (await import('pdfkit')).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const ORANGE = '#E85D24';
    const DARK   = '#0F0F0F';
    const GRAY   = '#6B7280';
    const W      = 612 - 100; // page width minus margins

    // ── Header ──
    doc.fontSize(22).fillColor(ORANGE).font('Helvetica-Bold')
       .text('LEGACY LAND & CATTLE', 50, 50);
    doc.fontSize(10).fillColor(GRAY).font('Helvetica')
       .text('6105 Burgess Rd, Colorado Springs CO 80908', 50, 78)
       .text('orders@legacylandandcattleco.com', 50, 91);

    doc.moveDown(1.5);
    doc.fontSize(16).fillColor(DARK).font('Helvetica-Bold')
       .text('BUYERS AGREEMENT', 50, doc.y, { align: 'center', width: W });

    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(GRAY).font('Helvetica')
       .text(`Contract Version: ${params.contractVersion}`, { align: 'center' });

    // Divider
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor(ORANGE).lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Customer Info ──
    doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('CUSTOMER INFORMATION');
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor(DARK);
    doc.text(`Name: ${params.customer.name}`);
    doc.text(`Address: ${params.customer.address}`);
    if (params.customer.city || params.customer.state || params.customer.zip) {
      doc.text(`City/State/Zip: ${[params.customer.city, params.customer.state, params.customer.zip].filter(Boolean).join(', ')}`);
    }
    doc.text(`Email: ${params.customer.email}`);
    doc.text(`Phone: ${params.customer.phone}`);

    doc.moveDown(1);

    // ── Purchase Details ──
    doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('PURCHASE DETAILS');
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor(DARK);
    doc.text(`Type: ${purchaseTypeLabel(params.purchaseType)}`);
    doc.text(`Animal: ${params.animal.name}`);
    doc.text(`Butcher Date: ${formatDate(params.animal.butcher_date)}`);
    doc.text(`Estimated Ready Date: ${formatDate(params.animal.estimated_ready_date)}`);
    doc.text(`Price per lb: $${Number(params.animal.price_per_lb).toFixed(2)}`);
    doc.text(`Deposit Amount: $${params.depositAmount}`);

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#E5E7EB').lineWidth(0.5).stroke();
    doc.moveDown(1);

    // ── Contract Terms ──
    doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('AGREEMENT TERMS');
    doc.moveDown(0.6);
    doc.fontSize(9.5).font('Helvetica').fillColor(DARK);

    const clauses = [
      {
        label: 'Clause 1 — Nonrefundable Deposit [AGREED]',
        text: `I agree that my NONREFUNDABLE DEPOSIT of $${params.depositAmount} is reserving my selections of meat and that the balance I owe will be due in full when I pick up my meat at 6105 Burgess Rd, Colorado Springs CO 80908, at a date and time to be determined.`,
      },
      {
        label: 'Clause 2 — Pickup Responsibility [AGREED]',
        text: `I agree that it is my responsibility to pick up my meat at 6105 Burgess Rd, Colorado Springs CO 80908 on the date(s) and time(s) specified by Legacy Land & Cattle and that these dates and times are to be determined once animals are sent for processing. I agree that if I am unable to pick up my meat, that I will send someone else to pick up my meat for me at the allotted time, as I fully understand that Legacy Land & Cattle does not have enough freezer space to store my frozen meat.`,
      },
      {
        label: 'Clause 3 — Hanging Weight Balance [AGREED]',
        text: `I agree that my final balance due is determined by the animals hanging weight and could vary depending on the size of the animal. I fully understand that Legacy Land & Cattle will inform me of the hanging/yield weight(s) and the corresponding balance that I owe once the animals have been sent for processing, but prior to the pick-up date.`,
      },
    ];

    for (const clause of clauses) {
      doc.font('Helvetica-Bold').fillColor(ORANGE).fontSize(9.5).text(clause.label);
      doc.moveDown(0.2);
      doc.font('Helvetica').fillColor(DARK).fontSize(9.5).text(clause.text, { width: W });
      doc.moveDown(0.8);
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#E5E7EB').lineWidth(0.5).stroke();
    doc.moveDown(1);

    // ── Signature Block ──
    doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('SIGNATURE');
    doc.moveDown(0.6);
    doc.fontSize(10).font('Helvetica').fillColor(DARK);
    doc.text('Signature: ___________________________');
    doc.moveDown(0.4);
    doc.text(`Name: ${params.signature}`);
    doc.text(`Date/Time: ${params.signedAt}`);
    doc.text(`IP Address: ${params.ipAddress}`);
    doc.text(`Contract Version: ${params.contractVersion}`);
    doc.text(`Session ID: ${params.sessionId}`);

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor(GRAY)
       .text('This electronic signature is legally binding under the E-SIGN Act (15 U.S.C. § 7001 et seq.) and has been recorded with the signer\'s IP address and timestamp.');

    doc.end();
  });
}

// ─── Email Builder (unused — email deferred to /api/payments/confirm) ──────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildContractEmail(params: {
  firstName: string;
  purchaseType: string;
  animalName: string;
  butcherDate: string;
  estimatedReady: string;
  pricePerLb: number;
  depositAmount: number;
  signature: string;
  signedAt: string;
}): string {
  const ORANGE = '#E85D24';
  const DARK   = '#0F0F0F';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Buyers Agreement — Legacy Land &amp; Cattle</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
  <!-- Header -->
  <tr><td style="background:${DARK};padding:24px 32px;">
    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">LEGACY LAND &amp; CATTLE</p>
    <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">6105 Burgess Rd, Colorado Springs CO 80908</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;">
    <p style="color:${ORANGE};font-size:14px;font-weight:600;margin:0 0 8px;">BUYERS AGREEMENT — SIGNED COPY</p>
    <h1 style="color:${DARK};font-size:24px;font-weight:700;margin:0 0 16px;">Hi ${params.firstName},</h1>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Thank you for signing your Buyers Agreement with Legacy Land &amp; Cattle. Your signed copy is attached to this email.
    </p>

    <!-- Order Summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr><td style="padding-bottom:12px;">
        <p style="color:#6b7280;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;margin:0 0 12px;">Order Summary</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Type</td>
            <td style="color:${DARK};font-size:13px;font-weight:600;text-align:right;">${params.purchaseType}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Animal</td>
            <td style="color:${DARK};font-size:13px;font-weight:600;text-align:right;">${params.animalName}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Butcher Date</td>
            <td style="color:${DARK};font-size:13px;font-weight:600;text-align:right;">${params.butcherDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Est. Ready</td>
            <td style="color:${DARK};font-size:13px;font-weight:600;text-align:right;">${params.estimatedReady}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Price/lb</td>
            <td style="color:${DARK};font-size:13px;font-weight:600;text-align:right;">$${Number(params.pricePerLb).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:4px 0;">Deposit</td>
            <td style="color:${ORANGE};font-size:13px;font-weight:700;text-align:right;">$${params.depositAmount}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- Next Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr><td>
        <p style="color:${ORANGE};font-size:12px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;margin:0 0 10px;">What Happens Next</p>
        <ul style="color:#374151;font-size:14px;line-height:1.7;margin:0;padding-left:20px;">
          <li>Deposit payment details will be sent separately</li>
          <li>We'll notify you when your animal goes to processing</li>
          <li>You'll receive cut sheet instructions before butcher day</li>
          <li>Pickup will be arranged at 6105 Burgess Rd, Colorado Springs</li>
        </ul>
      </td></tr>
    </table>

    <!-- Signature Confirmation -->
    <p style="color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:16px;">
      Signed by: <strong>${params.signature}</strong><br>
      Date: ${params.signedAt}
    </p>

    <p style="color:#374151;font-size:14px;margin:20px 0 0;">
      Questions? Email us at
      <a href="mailto:orders@legacylandandcattleco.com" style="color:${ORANGE};">orders@legacylandandcattleco.com</a>
    </p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center;">
      Legacy Land &amp; Cattle · 6105 Burgess Rd, Colorado Springs CO 80908<br>
      This electronic signature is legally binding under the E-SIGN Act.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── API Handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, signature, contract_version = '2026-v1' } = body;

    if (!session_id || !signature) {
      return NextResponse.json({ error: 'Missing session_id or signature' }, { status: 400 });
    }

    const ipAddress = getClientIp(request);

    // 1. Load session
    // Note: deposit_amount column requires Block 8 DB migration; fallback to purchase_type
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, customer_id, animal_id, purchase_type, contract_signed')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.contract_signed) {
      return NextResponse.json({ error: 'Contract already signed', session_id }, { status: 409 });
    }

    if (!session.customer_id) {
      return NextResponse.json({ error: 'Session has no customer linked' }, { status: 400 });
    }

    // 2. Load customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, name, email, phone, address, city, state, zip')
      .eq('id', session.customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // 3. Load animal
    const { data: animal, error: animalError } = await supabaseAdmin
      .from('animals')
      .select('id, name, butcher_date, estimated_ready_date, price_per_lb')
      .eq('id', session.animal_id)
      .single();

    if (animalError || !animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }

    // deposit_amount column requires Block 8 migration; use purchase_type fallback until then
    const depositAmount = depositForType(session.purchase_type);
    const now = new Date();
    const signedAt = now.toISOString();
    const signedAtFormatted = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    // 4. Update session record
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        contract_signed:     true,
        contract_signed_at:  signedAt,
        contract_ip:         ipAddress,
        contract_signature:  signature,
        contract_version:    contract_version,
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session contract fields:', updateError);
      return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 });
    }

    // NOTE: No confirmation email sent here.
    // Contract signing only records the signature in the DB.
    // A single comprehensive confirmation email is sent by /api/payments/confirm
    // after the deposit is successfully paid.

    // Log the contract signing notification (no email sent)
    await supabaseAdmin.from('notifications').insert({
      session_id,
      type:    'contract_signed',
      channel: 'email',
      sent_at: null,
      status:  'skipped', // Email deferred to /api/payments/confirm
    });

    return NextResponse.json({ success: true, session_id });
  } catch (err) {
    console.error('Contract sign unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
