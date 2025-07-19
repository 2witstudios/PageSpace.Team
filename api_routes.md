# API Routes

## GET /api/mentions/search

**Purpose:** Searches for pages, users, and other mentionable items.
**Auth Required:** Yes
**Request Schema:**
- q: string (the search query)
- driveId: string (the ID of the current drive)
- types: string[] (the types of items to search for)
**Response Schema:**
- MentionSuggestion[]
**Status Codes:** 200, 400, 401
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-19