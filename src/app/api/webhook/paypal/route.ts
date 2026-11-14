import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('PayPal-Signature');

    // Note: In production, verify the PayPal-Signature using PayPal SDK!
    if (!signature) {
      console.error("Webhook Failure: Missing PayPal Signature.");
      return NextResponse.json({ status: 'failed', message: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(payload);
    const transactionId = data.resource?.id;
    const status = data.event_type;

    if (status === "PAYMENT.CAPTURE.COMPLETED") {
      const paymentDetails = {
        transaction_id: transactionId || 'unknown',
        timestamp: new Date().toISOString(),
        amount: data.resource?.amount || {},
        status: "SUCCESS",
        raw_payload: payload.substring(0, 200) + "..."
      };

      // Save to Firestore 'payments' collection
      await db.collection('payments').add(paymentDetails);
      
      console.log(`✅ Webhook Success: Transaction ${transactionId} captured and staged in Firestore.`);
      return NextResponse.json({ status: 'success', message: 'Webhook received and saved.' }, { status: 200 });
    } else {
      return NextResponse.json({ status: 'received', message: `Event type ${status} handled.` }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
