import { useSuggestionStore } from '@/hooks/useSuggestion';
import { useDriveStore } from '@/hooks/useDrive';
import { MentionSuggestion, MentionType } from '@/types/mentions';

class MentionSystem {
  private triggerChar = '@';

  public trigger(element: HTMLElement, cursorPos: number, allowedTypes?: MentionType[]) {
    console.log('mentionSystem.trigger', element, cursorPos);
    const text = element.textContent || '';
    const query = this.findQuery(text, cursorPos);

    if (query !== null) {
      const rect = this.getCursorRect(element, cursorPos);
      useSuggestionStore.getState().open(
        null, // We'll pass the editor instance later from the adapter
        { top: rect.bottom, left: rect.left },
        query,
        (suggestion) => this.insert(element, suggestion),
        allowedTypes
      );
      this.search(query, allowedTypes);
    } else {
      useSuggestionStore.getState().close();
    }
  }

  public async search(query: string, allowedTypes?: MentionType[]) {
    const { currentDriveId } = useDriveStore.getState();
    const { allowedTypes: storeAllowedTypes } = useSuggestionStore.getState();
    
    const types = allowedTypes || storeAllowedTypes;
    
    if (!currentDriveId) {
      useSuggestionStore.getState().setItems([]);
      return;
    }

    try {
      const typesParam = types.join(',');
      const response = await fetch(
        `/api/mentions/search?q=${encodeURIComponent(query)}&driveId=${currentDriveId}&types=${typesParam}`
      );
      
      if (!response.ok) {
        useSuggestionStore.getState().setItems([]);
        return;
      }
      
      const suggestions: MentionSuggestion[] = await response.json();
      useSuggestionStore.getState().setItems(suggestions);
    } catch (error) {
      console.error("Failed to fetch mention suggestions:", error);
      useSuggestionStore.getState().setItems([]);
    }
  }

  public insert(element: HTMLElement, suggestion: MentionSuggestion) {
    // This is a placeholder. The actual insertion logic will be
    // handled by the adapter for each specific input type.
    console.log(`Inserting mention: ${suggestion.label} (${suggestion.id}) of type ${suggestion.type}`);
    useSuggestionStore.getState().close();
  }

  private findQuery(text: string, cursorPos: number): string | null {
    const textBeforeCursor = text.slice(0, cursorPos);
    const triggerIndex = textBeforeCursor.lastIndexOf(this.triggerChar);

    if (triggerIndex === -1) {
      return null;
    }

    const query = textBeforeCursor.slice(triggerIndex + 1);
    if (/\s/.test(query)) {
      return null;
    }

    return query;
  }

  private getCursorRect(element: HTMLElement, cursorPos: number): DOMRect {
    const range = document.createRange();
    const textNode = element.firstChild;
    if (textNode && cursorPos <= textNode.textContent!.length) {
      range.setStart(textNode, cursorPos);
      range.setEnd(textNode, cursorPos);
      return range.getBoundingClientRect();
    }
    return element.getBoundingClientRect();
  }
}

export const mentionSystem = new MentionSystem();