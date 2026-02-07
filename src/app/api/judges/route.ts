import { NextResponse } from 'next/server';
import { createJudge } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    createJudge(body.id, body.name, body.role || 'learner');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating judge:', error);
    return NextResponse.json({ error: 'Failed to create judge' }, { status: 500 });
  }
}
