import { NextResponse } from 'next/server';
import { db } from 'packages/db/src/index';
import { aiAuditLog } from 'packages/db/src/schema';
import { v4 as uuidv4 } from 'uuid';
import { authenticateRequest } from '@/app/api/ai/shared/auth';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const body = await request.json();
    const { action, details } = body;

    if (!action || !details) {
      return NextResponse.json(
        { error: 'Missing action or details' },
        { status: 400 }
      );
    }

    await db.insert(aiAuditLog).values({
      id: uuidv4(),
      userId,
      action,
      details,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in AI audit route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}