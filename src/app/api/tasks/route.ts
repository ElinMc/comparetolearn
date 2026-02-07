import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { createTask, getTasks } from '@/lib/db';

export async function GET() {
  try {
    const tasks = getTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ tasks: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = uuid();
    createTask(id, body.title, body.subject, body.criteria, body.description);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
