import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { createArtefact, getArtefacts } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artefacts = getArtefacts(id);
    return NextResponse.json({ artefacts });
  } catch (error) {
    console.error('Error fetching artefacts:', error);
    return NextResponse.json({ artefacts: [] });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const id = uuid();
    createArtefact(id, taskId, body.title, body.content, body.type || 'text');
    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Error creating artefact:', error);
    return NextResponse.json({ error: 'Failed to create artefact' }, { status: 500 });
  }
}
