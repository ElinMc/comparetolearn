import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { createJudgement } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = uuid();
    
    createJudgement(
      id,
      body.taskId,
      body.artefactAId,
      body.artefactBId,
      body.chosenId,
      body.reasoning || '',
      body.judgeId,
      body.timeTakenMs || 0
    );
    
    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Error creating judgement:', error);
    return NextResponse.json({ error: 'Failed to create judgement' }, { status: 500 });
  }
}
