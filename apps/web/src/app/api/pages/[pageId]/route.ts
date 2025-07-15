import { NextResponse } from 'next/server';
import { pages, mentions, aiChats, chatMessages, db, and, eq, inArray } from '@pagespace/db';
import { decodeToken, getUserAccessLevel } from '@pagespace/lib';
import { parse } from 'cookie';
import { z } from "zod";
import type { JSONContent } from '@tiptap/core';

type DatabaseType = typeof db;
type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Helper function to find mention nodes in Tiptap content
function findMentionNodes(node: JSONContent): string[] {
  let pageIds: string[] = [];
  if (node.type === 'mention' && node.attrs?.id) {
    pageIds.push(node.attrs.id);
  }
  if (node.content) {
    for (const child of node.content) {
      pageIds = pageIds.concat(findMentionNodes(child));
    }
  }
  return pageIds;
}

// Helper function to sync mentions
async function syncMentions(sourcePageId: string, content: JSONContent, tx: TransactionType | DatabaseType) {
  const mentionedPageIds = findMentionNodes(content);

  const existingMentionsQuery = await tx.select({ targetPageId: mentions.targetPageId }).from(mentions).where(eq(mentions.sourcePageId, sourcePageId));
  const existingMentionIds = new Set(existingMentionsQuery.map(m => m.targetPageId));

  const toCreate = mentionedPageIds.filter(id => !existingMentionIds.has(id));
  const toDelete = Array.from(existingMentionIds).filter(id => !mentionedPageIds.includes(id));

  if (toCreate.length > 0) {
    await tx.insert(mentions).values(toCreate.map(targetPageId => ({
      sourcePageId,
      targetPageId,
    })));
  }

  if (toDelete.length > 0) {
    await tx.delete(mentions).where(and(
      eq(mentions.sourcePageId, sourcePageId),
      inArray(mentions.targetPageId, toDelete)
    ));
  }
}

// Helper function for recursive trashing
async function recursivelyTrash(pageId: string, tx: TransactionType | DatabaseType) {
    const children = await tx.select({ id: pages.id }).from(pages).where(eq(pages.parentId, pageId));

    for (const child of children) {
        await recursivelyTrash(child.id, tx);
    }

    await tx.update(pages).set({ isTrashed: true, trashedAt: new Date() }).where(eq(pages.id, pageId));
}

export async function GET(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const decoded = await decodeToken(accessToken);
  if (!decoded) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Check user permissions first
    const accessLevel = await getUserAccessLevel(decoded.userId, pageId);
    if (!accessLevel) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch the primary page object
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Fetch related data in parallel for better performance
    const [children, aiChat, messages] = await Promise.all([
      db.query.pages.findMany({ 
        where: eq(pages.parentId, pageId) 
      }),
      db.query.aiChats.findFirst({ 
        where: eq(aiChats.pageId, pageId) 
      }),
      db.query.chatMessages.findMany({ 
        where: and(eq(chatMessages.pageId, pageId), eq(chatMessages.isActive, true)),
        with: { user: true },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      })
    ]);

    const pageWithDetails = {
      ...page,
      children,
      aiChat,
      messages
    };

    return NextResponse.json(pageWithDetails);
  } catch (error) {
    console.error('Error fetching page details:', error);
    return NextResponse.json({ error: 'Failed to fetch page details' }, { status: 500 });
  }
}

const patchSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const decoded = decodeToken(accessToken);
  if (!decoded) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const safeBody = patchSchema.parse(body);

    await db.transaction(async (tx) => {
      await tx.update(pages).set({ ...safeBody }).where(eq(pages.id, pageId));

      if (safeBody.content) {
        await syncMentions(pageId, safeBody.content, tx);
      }
    });

    // Refetch the page with all details to ensure the client gets the full object
    const [updatedPage, children, aiChat, messages] = await Promise.all([
      db.query.pages.findFirst({
        where: eq(pages.id, pageId),
      }),
      db.query.pages.findMany({ 
        where: eq(pages.parentId, pageId) 
      }),
      db.query.aiChats.findFirst({ 
        where: eq(aiChats.pageId, pageId) 
      }),
      db.query.chatMessages.findMany({ 
        where: and(eq(chatMessages.pageId, pageId), eq(chatMessages.isActive, true)),
        with: { user: true },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      })
    ]);

    const updatedPageWithDetails = {
      ...updatedPage,
      children,
      aiChat,
      messages
    };

    return NextResponse.json(updatedPageWithDetails);
  } catch (error) {
    console.error('Error updating page:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

const deleteSchema = z.object({
  trash_children: z.boolean().optional(),
}).nullable();

export async function DELETE(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const decoded = decodeToken(accessToken);
  if (!decoded) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const parsedBody = deleteSchema.parse(body);
    const trashChildren = parsedBody?.trash_children ?? false;

    await db.transaction(async (tx) => {
      if (trashChildren) {
        await recursivelyTrash(pageId, tx);
      } else {
        const page = await tx.query.pages.findFirst({ where: eq(pages.id, pageId) });
        await tx.update(pages).set({
          parentId: page?.parentId,
          originalParentId: pageId
        }).where(eq(pages.parentId, pageId));

        await tx.update(pages).set({ isTrashed: true, trashedAt: new Date() }).where(eq(pages.id, pageId));
      }
    });

    return NextResponse.json({ message: 'Page moved to trash successfully.' });
  } catch (error) {
    console.error('Error deleting page:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}