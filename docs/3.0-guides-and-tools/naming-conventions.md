# File Naming Conventions

### Consistency Rules

#### 1. Kebab-Case for Directories
- `/page-views/` not `/pageViews/`
- `/ai-page/` not `/aiPage/`
- `/content-header/` not `/contentHeader/`

#### 2. PascalCase for Components
- `TiptapChatInput.tsx`
- `MessagePartRenderer.tsx`
- `AiChatView.tsx`

#### 3. Descriptive Naming
Names should clearly indicate purpose and scope:
- ✅ `AiChatView.tsx` - AI-specific chat interface
- ✅ `ChannelView.tsx` - People-to-people channel interface
- ✅ `TiptapRenderer.tsx` - Rich text display component
- ❌ `ChatView.tsx` - Ambiguous chat type