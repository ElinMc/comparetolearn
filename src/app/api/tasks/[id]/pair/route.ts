import { NextResponse } from 'next/server';
import { getNextPair } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const judgeId = url.searchParams.get('judgeId') || '';
    
    const pair = getNextPair(id, judgeId);
    return NextResponse.json({ pair });
  } catch (error) {
    console.error('Error fetching pair:', error);
    return NextResponse.json({ pair: null });
  }
}
