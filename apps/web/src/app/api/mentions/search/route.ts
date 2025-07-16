import { NextResponse } from 'next/server';
// TODO: Add database imports when available
// import { db } from 'packages/db/src/index';
// import { users } from 'packages/db/src/schema/auth';
// import { pages } from 'packages/db/src/schema';
// import { ilike, or, and, eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    // documentId is reserved for future use when implementing document-specific mention filtering
    // const documentId = searchParams.get('documentId');

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    let filteredUsers: { id: string; name: string }[] = [];
    let filteredPages: { id: string; title: string }[] = [];

    try {
      // TODO: Implement real database search when drizzle-orm is available
      // For now, fall through to mock data
      throw new Error('Database integration pending');

    } catch (dbError) {
      console.error('Database error in mention search:', dbError);
      
      // Fallback to enhanced mock data for development
      const mockUsers = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Doe' },
        { id: '3', name: 'Bob Smith' },
        { id: '4', name: 'Alice Johnson' },
        { id: '5', name: 'Charlie Brown' },
      ];

      const mockPages = [
        { id: '1', title: 'Project Plan' },
        { id: '2', title: 'Meeting Notes' },
        { id: '3', title: 'Technical Documentation' },
        { id: '4', title: 'Sprint Planning' },
        { id: '5', title: 'Design System' },
      ];

      filteredUsers = mockUsers.filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase())
      );

      filteredPages = mockPages.filter((page) =>
        page.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply ranking based on search strategy
    const rankedUsers = filteredUsers.map(user => ({
      ...user,
      score: calculateRelevanceScore(user.name, query),
    })).sort((a, b) => b.score - a.score);

    const rankedPages = filteredPages.map(page => ({
      id: page.id,
      title: page.title,
      score: calculateRelevanceScore(page.title, query),
    })).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      users: rankedUsers.slice(0, Math.ceil(limit / 2)),
      pages: rankedPages.slice(0, Math.ceil(limit / 2)),
      query,
      total: rankedUsers.length + rankedPages.length,
    });

  } catch (error) {
    console.error('Error in mention search route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate relevance score for search ranking
 */
function calculateRelevanceScore(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return 100;
  
  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 80;
  
  // Contains query as whole word gets medium score
  const wordBoundaryRegex = new RegExp(`\\b${queryLower}\\b`, 'i');
  if (wordBoundaryRegex.test(textLower)) return 60;
  
  // Contains query gets lower score
  if (textLower.includes(queryLower)) return 40;
  
  // Character-based similarity for fuzzy matching
  const similarity = calculateStringSimilarity(textLower, queryLower);
  return Math.round(similarity * 30);
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const maxLength = Math.max(len1, len2);
  return (maxLength - matrix[len2][len1]) / maxLength;
}