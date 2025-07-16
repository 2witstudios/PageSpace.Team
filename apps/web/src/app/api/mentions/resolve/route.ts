import { NextResponse } from 'next/server';
// TODO: Add database imports when available
// import { db } from 'packages/db/src/index';
// import { users } from 'packages/db/src/schema/auth';
// import { pages } from 'packages/db/src/schema';
// import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'user' | 'page';
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing type or id parameter' },
        { status: 400 }
      );
    }

    let entity = null;

    if (type === 'user') {
      // TODO: Implement real database lookup when drizzle-orm is available
      // For now, use mock data
      const mockUsers = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Doe' },
        { id: '3', name: 'Bob Smith' },
        { id: '4', name: 'Alice Johnson' },
        { id: '5', name: 'Charlie Brown' },
        { id: 'john-doe', name: 'John Doe' },
        { id: 'jane-doe', name: 'Jane Doe' },
      ];
      entity = mockUsers.find(u => u.id === id) || null;
    } else if (type === 'page') {
      // TODO: Implement real database lookup when drizzle-orm is available
      // For now, use mock data
      const mockPages = [
        { id: '1', name: 'Project Plan' },
        { id: '2', name: 'Meeting Notes' },
        { id: '3', name: 'Technical Documentation' },
        { id: '4', name: 'Sprint Planning' },
        { id: '5', name: 'Design System' },
        { id: 'project-plan', name: 'Project Plan' },
        { id: 'meeting-notes', name: 'Meeting Notes' },
      ];
      entity = mockPages.find(p => p.id === id) || null;
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "user" or "page"' },
        { status: 400 }
      );
    }

    if (!entity) {
      return NextResponse.json(
        { error: `${type} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error in mention resolve route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}