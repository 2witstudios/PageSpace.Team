# Component Organization Philosophy

### `/components/` Directory Structure

```
/components/
├── ui/                     # Pure shadcn/ui framework components
├── providers/              # Global context providers (ThemeProvider, etc.)
├── shared/                 # Simple reusable components across contexts
├── layout/                 # Main structural application layout
├── messages/               # Universal message handling & input
├── mentions/               # Entity mention system components
├── rich-text/              # Rich text editing & rendering
├── dialogs/                # Custom application-specific dialogs
└── ...feature-specific/    # Other feature-based directories
```

### Organizational Principles

#### 1. Scope-Based Organization
Components are organized by **scope and usage context**, not implementation details:
- **Global scope**: `/ui/`, `/providers/`, `/shared/`
- **Layout scope**: `/layout/` with clear visual hierarchy
- **Feature scope**: `/messages/`, `/mentions/`, `/rich-text/`
- **Interaction Scope**: `/dialogs/` for application-specific modals and pop-ups.

#### 2. Usage-Driven Naming
Directory names reflect **what they're used for**, not how they're built:
- ✅ `/rich-text/` - Used for rich text across documents, messages, forms
- ✅ `/messages/` - Handles messaging across AI chats, channels, DMs
- ✅ `/mentions/` - Manages entity mentions across all contexts
- ❌ `/chat/` - Ambiguous, conflicts with API terminology

#### 3. Framework vs Application Separation
Clear separation between framework components and application logic:
- **Framework components** (`/ui/`): Pure shadcn/ui, no application logic
- **Application components** (other directories): Custom logic, business rules

#### 4. Future-Proof Structure
Organization anticipates growth and new features:
- Rich text components work for documents, pages, forms, comments
- Message components handle forums, notifications, any messaging
- Mention system supports new entity types without restructuring