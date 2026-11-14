import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const reviewData = await req.json();
    if (!reviewData) {
      return NextResponse.json({ status: 'failed', message: 'No payload' }, { status: 400 });
    }

    const reviewEntry = {
      timestamp: new Date().toISOString(),
      rating: reviewData.rating || 5,
      content: reviewData.content || ''
    };

    await db.collection('reviews').add(reviewEntry);

    return NextResponse.json({ status: 'success', message: 'Review saved successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Review tracking error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
