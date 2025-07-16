# Page & Mention Routes

### GET /api/mentions/search

**Purpose:** Searches for users and pages to be used in mentions.
**Auth Required:** Yes
**Request Schema:**
- q: string (query parameter - search query)
**Response Schema:**
- users: Array of user objects with id and name
- pages: Array of page objects with id and title
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-15

### POST /api/pages

**Purpose:** Creates a new page.
**Auth Required:** Yes
**Request Schema:**
- title: string
- type: "DOCUMENT" | "FOLDER" | "AI_CHAT"
- parentId: string | null
- driveSlug: string
- content: any (optional)
**Response Schema:** Newly created page object with optional AI chat details.
**Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]

**Purpose:** Fetches details for a specific page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
**Response Schema:** Page object with nested details.
**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/pages/[pageId]

**Purpose:** Updates a page's title or content, and syncs mentions.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
- title: string (optional)
- content: JSONContent (optional)
**Response Schema:** Updated page object with nested details.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### DELETE /api/pages/[pageId]

**Purpose:** Moves a page (and optionally its children) to trash.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
- trash_children: boolean (optional)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]/breadcrumbs

**Purpose:** Fetches the breadcrumbs (ancestor path) for a given page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
**Response Schema:** Array of breadcrumb page objects.
**Status Codes:** 200 (OK), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]/children

**Purpose:** Fetches the direct children pages of a given page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
**Response Schema:** Array of child page objects.
**Status Codes:** 200 (OK), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/[pageId]/permissions

**Purpose:** Fetches all permissions for a specific page, including owner and enriched subject details.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
**Response Schema:** Object containing owner and permissions array.
**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/pages/[pageId]/permissions

**Purpose:** Creates a new permission for a page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
- subjectId: string
- subjectType: "USER" | "GROUP"
- action: "VIEW" | "EDIT" | "SHARE" | "DELETE"
**Response Schema:** Newly created permission object.
**Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### DELETE /api/pages/[pageId]/permissions/[permissionId]

**Purpose:** Revokes a specific permission from a page.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
- permissionId: string (dynamic parameter)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### POST /api/pages/[pageId]/restore

**Purpose:** Restores a trashed page (and its trashed children) from the trash.
**Auth Required:** Yes
**Request Schema:**
- pageId: string (dynamic parameter)
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### PATCH /api/pages/reorder

**Purpose:** Reorders a page by changing its parent and/or position.
**Auth Required:** Yes
**Request Schema:**
- pageId: string
- newParentId: string | null
- newPosition: number
**Response Schema:** Message object.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13

### GET /api/pages/search

**Purpose:** Searches for pages by title within a specific drive.
**Auth Required:** Yes
**Request Schema:**
- q: string (query parameter - search query)
- driveId: string (query parameter)
**Response Schema:** Array of simplified page objects.
**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error)
**Next.js 15 Handler:** async function returning Response/NextResponse
**Last Updated:** 2025-07-13