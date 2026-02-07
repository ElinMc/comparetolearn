import { NextResponse } from 'next/server';
import { getTaskStats } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stats = getTaskStats(id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ totalJudgements: 0, totalArtefacts: 0, rankings: [] });
  }
}
