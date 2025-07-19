# Plan: RichlineEditor Enhancements

This document outlines the plan to improve the `RichlineEditor` component, focusing on layout, zoom functionality, and the addition of line numbers.

## Phased Todo List

### Phase 1: Fix Centering and Container Layout
- [ ] **1. Update NoteView.tsx container styling:**
    - Remove existing flex layout that pushes editor to the side.
    - Add proper centering CSS (flexbox with `justify-center`).
    - Ensure the paper-like editor appears centered on the page.
- [ ] **2. Improve RichlineEditor container responsiveness:**
    - Keep 8.5in width but make it responsive for smaller screens.
    - Add `max-width` constraints and proper margins.

### Phase 2: Fix Zoom Implementation
- [ ] **3. Replace CSS `transform: scale()` with proper font scaling:**
    - Remove `transform: scale()` from the current zoom implementation.
    - Update zoom to scale `font-size`, `line-height`, and `padding` proportionally.
    - Ensure all measurements scale together (like Google Docs).
- [ ] **4. Test zoom functionality:**
    - Verify text becomes genuinely larger/smaller.
    - Ensure paper constraints still work at different zoom levels.
    - Check that focus and cursor behavior remains stable.

### Phase 3: Add Line Numbers Feature
- [ ] **5. Update `RichlineEditorProps` interface:**
    - Add `showLineNumbers?: boolean` prop (default `false`).
- [ ] **6. Implement line numbers gutter:**
    - Add flexbox layout when `showLineNumbers` is true.
    - Create line numbers container that maps over current lines.
    - Ensure line numbers sync with dynamic line operations.
- [ ] **7. Update CSS for line numbers:**
    - Add styles for `.richline-line-numbers` gutter.
    - Ensure line numbers scale with zoom level.
    - Style with right-aligned numbers and subtle background.
- [ ] **8. Enable line numbers in `NoteView`:**
    - Pass `showLineNumbers={true}` to `RichlineEditor`.
    - Test integration with zoom and centering.

### Phase 4: Polish and Testing
- [ ] **9. Cross-browser testing:**
    - Verify layout works on different screen sizes.
    - Test zoom behavior across browsers.
    - Ensure line numbers stay synchronized during editing.
- [ ] **10. Performance verification:**
    - Confirm no impact on auto-save functionality.
    - Test with large documents.
    - Verify WASM integration remains stable.

This approach will deliver a Google Docs-like experience with proper centering, real zoom functionality, and clean line numbers that work together harmoniously.