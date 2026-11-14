import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statRef = db.collection('traffic_logs').doc(today);

    // Increment visit count transactionally
    await db.runTransaction(async (transaction: any) => {
      const doc = await transaction.get(statRef);
      if (!doc.exists) {
        transaction.set(statRef, { visits: 1 });
      } else {
        const newVisits = (doc.data()?.visits || 0) + 1;
        transaction.update(statRef, { visits: newVisits });
      }
    });

    const updatedDoc = await statRef.get();
    const todayVisits = updatedDoc.data()?.visits || 1;

    return NextResponse.json({ status: 'success', today_visits: todayVisits }, { status: 200 });
  } catch (error: any) {
    console.error('Visit tracking error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
