import { Mark, MarkType } from '@/components/ai-editor/types';

/**
 * Maps cursor position from display text to markdown text
 * This is needed when user clicks/types in rich display mode
 */
export function mapDisplayToMarkdown(
  displayPosition: number,
  markdownText: string,
  marks: Mark[]
): number {
  if (!marks || marks.length === 0) {
    return displayPosition;
  }

  let markdownPos = 0;
  let displayPos = 0;

  // Sort marks by display position
  const sortedMarks = [...marks].sort((a, b) => a.start - b.start);

  for (const mark of sortedMarks) {
    // If we haven't reached the target position yet, keep mapping
    if (displayPos < displayPosition) {
      // Add text before this mark
      const beforeMarkLength = mark.start - displayPos;
      if (displayPos + beforeMarkLength >= displayPosition) {
        // Target position is in the text before this mark
        const offset = displayPosition - displayPos;
        return markdownPos + offset;
      }

      // Move past the text before the mark
      markdownPos += beforeMarkLength;
      displayPos = mark.start;

      // Now handle the mark itself
      const markDisplayLength = mark.end - mark.start;
      if (displayPos + markDisplayLength >= displayPosition) {
        // Target position is within this mark
        const offset = displayPosition - displayPos;
        return markdownPos + getMarkdownStartLength(mark) + offset;
      }

      // Move past the mark
      const markMarkdownLength = getMarkdownLength(mark, markdownText);
      markdownPos += markMarkdownLength;
      displayPos = mark.end;
    } else {
      break;
    }
  }

  // If we're past all marks, add the remaining offset
  if (displayPos < displayPosition) {
    const remainingOffset = displayPosition - displayPos;
    return markdownPos + remainingOffset;
  }

  return markdownPos;
}

/**
 * Maps cursor position from markdown text to display text
 * This is needed when setting cursor position in rich display mode
 */
export function mapMarkdownToDisplay(
  markdownPosition: number,
  markdownText: string,
  marks: Mark[]
): number {
  if (!marks || marks.length === 0) {
    return markdownPosition;
  }

  let markdownPos = 0;
  let displayPos = 0;

  // Find marks that affect the markdown text up to our position
  const relevantMarks = marks.filter(mark => {
    const markStart = getMarkStartInMarkdown(mark, markdownText);
    return markStart <= markdownPosition;
  }).sort((a, b) => getMarkStartInMarkdown(a, markdownText) - getMarkStartInMarkdown(b, markdownText));

  for (const mark of relevantMarks) {
    const markStartInMarkdown = getMarkStartInMarkdown(mark, markdownText);
    const markEndInMarkdown = markStartInMarkdown + getMarkdownLength(mark, markdownText);

    // Add text before this mark
    if (markStartInMarkdown > markdownPos) {
      const beforeMarkLength = markStartInMarkdown - markdownPos;
      if (markdownPos + beforeMarkLength >= markdownPosition) {
        // Target position is before this mark
        const offset = markdownPosition - markdownPos;
        return displayPos + offset;
      }
      displayPos += beforeMarkLength;
      markdownPos = markStartInMarkdown;
    }

    // Check if target position is within this mark
    if (markdownPosition <= markEndInMarkdown) {
      if (markdownPosition <= markStartInMarkdown + getMarkdownStartLength(mark)) {
        // Position is in the start syntax (e.g., "**")
        return displayPos;
      } else if (markdownPosition >= markEndInMarkdown - getMarkdownEndLength(mark)) {
        // Position is in the end syntax (e.g., "**")
        return displayPos + (mark.end - mark.start);
      } else {
        // Position is in the content
        const offsetInContent = markdownPosition - markStartInMarkdown - getMarkdownStartLength(mark);
        return displayPos + offsetInContent;
      }
    }

    // Move past this mark
    displayPos += mark.end - mark.start;
    markdownPos = markEndInMarkdown;
  }

  // Add any remaining text
  if (markdownPos < markdownPosition) {
    const remainingOffset = markdownPosition - markdownPos;
    return displayPos + remainingOffset;
  }

  return displayPos;
}

/**
 * Gets the start position of a mark in the markdown text
 */
function getMarkStartInMarkdown(mark: Mark, markdownText: string): number {
  // This is a simplified approach - in a real implementation, you'd need to
  // parse the markdown to find the exact positions
  // For now, we'll use the mark's metadata if available
  if (mark.metadata && typeof mark.metadata.markdownStart === 'number') {
    return mark.metadata.markdownStart;
  }
  
  // Fallback: search for the pattern in markdown text
  const content = getMarkContent(mark, markdownText);
  if (mark.type === MarkType.Bold) {
    const pattern = `**${content}**`;
    return markdownText.indexOf(pattern);
  } else if (mark.type === MarkType.Italic) {
    const pattern = `*${content}*`;
    return markdownText.indexOf(pattern);
  } else if (mark.type === MarkType.Mention) {
    if (mark.metadata?.isStableId) {
      if (mark.metadata.mentionType === 'user') {
        const pattern = `@user:${mark.value}`;
        return markdownText.indexOf(pattern);
      } else {
        const pattern = `[[page:${mark.value}]]`;
        return markdownText.indexOf(pattern);
      }
    } else {
      // Legacy format
      if (mark.metadata?.mentionType === 'user') {
        const pattern = `@${mark.value}`;
        return markdownText.indexOf(pattern);
      } else {
        const pattern = `[[${mark.value}]]`;
        return markdownText.indexOf(pattern);
      }
    }
  }
  
  return 0;
}

/**
 * Gets the total length of a mark in markdown text (including syntax)
 */
function getMarkdownLength(mark: Mark, markdownText: string): number {
  const content = getMarkContent(mark, markdownText);
  
  if (mark.type === MarkType.Bold) {
    return content.length + 4; // **content**
  } else if (mark.type === MarkType.Italic) {
    return content.length + 2; // *content*
  } else if (mark.type === MarkType.Mention) {
    if (mark.metadata?.isStableId) {
      if (mark.metadata.mentionType === 'user') {
        return `@user:${mark.value}`.length;
      } else {
        return `[[page:${mark.value}]]`.length;
      }
    } else {
      // Legacy format
      if (mark.metadata?.mentionType === 'user') {
        return `@${mark.value}`.length;
      } else {
        return `[[${mark.value}]]`.length;
      }
    }
  }
  
  return content.length;
}

/**
 * Gets the length of the start syntax for a mark
 */
function getMarkdownStartLength(mark: Mark): number {
  if (mark.type === MarkType.Bold) {
    return 2; // **
  } else if (mark.type === MarkType.Italic) {
    return 1; // *
  } else if (mark.type === MarkType.Mention) {
    if (mark.metadata?.isStableId) {
      if (mark.metadata.mentionType === 'user') {
        return 6; // @user:
      } else {
        return 7; // [[page:
      }
    } else {
      // Legacy format
      if (mark.metadata?.mentionType === 'user') {
        return 1; // @
      } else {
        return 2; // [[
      }
    }
  }
  
  return 0;
}

/**
 * Gets the length of the end syntax for a mark
 */
function getMarkdownEndLength(mark: Mark): number {
  if (mark.type === MarkType.Bold) {
    return 2; // **
  } else if (mark.type === MarkType.Italic) {
    return 1; // *
  } else if (mark.type === MarkType.Mention) {
    if (mark.metadata?.isStableId && mark.metadata.mentionType === 'page') {
      return 2; // ]]
    } else if (!mark.metadata?.isStableId && mark.metadata?.mentionType === 'page') {
      return 2; // ]]
    }
    return 0; // User mentions don't have end syntax
  }
  
  return 0;
}

/**
 * Extracts the content of a mark (without syntax)
 */
function getMarkContent(mark: Mark, markdownText: string): string {
  // Try to extract from the mark's value or displayName
  if (mark.displayName) {
    return mark.displayName;
  } else if (mark.value) {
    return mark.value;
  }
  
  // Fallback: try to extract from markdown text based on display positions
  // This is approximate and may not be perfect
  const startPos = getMarkStartInMarkdown(mark, markdownText);
  const startSyntaxLength = getMarkdownStartLength(mark);
  const endSyntaxLength = getMarkdownEndLength(mark);
  const totalLength = getMarkdownLength(mark, markdownText);
  const contentLength = totalLength - startSyntaxLength - endSyntaxLength;
  
  return markdownText.substring(startPos + startSyntaxLength, startPos + startSyntaxLength + contentLength);
}