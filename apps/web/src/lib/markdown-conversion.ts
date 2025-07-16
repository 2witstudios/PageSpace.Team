import { Line, Mark, MarkType } from '@/components/ai-editor/types';

/**
 * Converts markdown text to display text and marks
 * Input: "Hello **world** @user:123 this is *italic*"
 * Output: { displayText: "Hello world @John Doe this is italic", marks: [...] }
 */
export function markdownToRichText(markdownText: string): { displayText: string; marks: Mark[] } {
  const marks: Mark[] = [];
  let displayText = '';
  let currentPos = 0;
  
  // Process markdown patterns
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, type: MarkType.Bold },
    { regex: /\*([^*]+)\*/g, type: MarkType.Italic },
    { regex: /@user:([^\s]+)/g, type: MarkType.Mention, mentionType: 'user' as const },
    { regex: /\[\[page:([^\]]+)\]\]/g, type: MarkType.Mention, mentionType: 'page' as const },
    { regex: /@(\w+)/g, type: MarkType.Mention, mentionType: 'user' as const, legacy: true },
    { regex: /\[\[([^\]]+)\]\]/g, type: MarkType.Mention, mentionType: 'page' as const, legacy: true },
  ];
  
  const markPositions: Array<{ start: number; end: number; mark: Mark }> = [];
  
  // Find all matches and their positions
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex);
    
    while ((match = regex.exec(markdownText)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      const content = match[1];
      
      let displayContent = content;
      let value = content;
      
      // Handle mentions
      if (pattern.type === MarkType.Mention) {
        if (pattern.mentionType === 'user') {
          if (pattern.legacy) {
            displayContent = `@${content}`;
            value = content;
          } else {
            displayContent = `@${content}`; // TODO: Resolve to actual name
            value = content;
          }
        } else if (pattern.mentionType === 'page') {
          if (pattern.legacy) {
            displayContent = content;
            value = content;
          } else {
            displayContent = content; // TODO: Resolve to actual title
            value = content;
          }
        }
      }
      
      markPositions.push({
        start: matchStart,
        end: matchEnd,
        mark: {
          type: pattern.type,
          start: 0, // Will be calculated later
          end: 0,   // Will be calculated later
          value,
          displayName: pattern.type === MarkType.Mention ? displayContent : undefined,
          metadata: pattern.type === MarkType.Mention ? {
            mentionType: pattern.mentionType,
            mentionId: value,
            isStableId: !pattern.legacy,
            markdownStart: matchStart,
            markdownEnd: matchEnd
          } : {
            markdownStart: matchStart,
            markdownEnd: matchEnd
          }
        }
      });
    }
  }
  
  // Sort by position
  markPositions.sort((a, b) => a.start - b.start);
  
  // Build display text and calculate mark positions
  let displayOffset = 0;
  currentPos = 0;
  
  for (const { start, end, mark } of markPositions) {
    // Add text before this mark
    displayText += markdownText.substring(currentPos, start);
    displayOffset += start - currentPos;
    
    // Add the mark content
    const markStart = displayOffset;
    let markContent = '';
    
    if (mark.type === MarkType.Bold) {
      markContent = markdownText.substring(start + 2, end - 2); // Remove **
    } else if (mark.type === MarkType.Italic) {
      markContent = markdownText.substring(start + 1, end - 1); // Remove *
    } else if (mark.type === MarkType.Mention) {
      markContent = mark.displayName || mark.value || '';
    }
    
    displayText += markContent;
    displayOffset += markContent.length;
    
    // Set mark positions
    mark.start = markStart;
    mark.end = displayOffset;
    marks.push(mark);
    
    currentPos = end;
  }
  
  // Add remaining text
  displayText += markdownText.substring(currentPos);
  
  return { displayText, marks };
}

/**
 * Converts display text with marks back to markdown
 * Input: { displayText: "Hello world @John Doe this is italic", marks: [...] }
 * Output: "Hello **world** @user:123 this is *italic*"
 */
export function richTextToMarkdown(displayText: string, marks: Mark[]): string {
  if (!marks || marks.length === 0) {
    return displayText;
  }
  
  // Sort marks by position (reversed for easier processing)
  const sortedMarks = [...marks].sort((a, b) => b.start - a.start);
  
  let result = displayText;
  
  // Process marks from end to start to avoid position shifting
  for (const mark of sortedMarks) {
    const content = result.substring(mark.start, mark.end);
    let replacement = '';
    
    switch (mark.type) {
      case MarkType.Bold:
        replacement = `**${content}**`;
        break;
      case MarkType.Italic:
        replacement = `*${content}*`;
        break;
      case MarkType.Mention:
        if (mark.metadata?.mentionType === 'user') {
          if (mark.metadata?.isStableId) {
            replacement = `@user:${mark.value}`;
          } else {
            replacement = `@${mark.value}`;
          }
        } else if (mark.metadata?.mentionType === 'page') {
          if (mark.metadata?.isStableId) {
            replacement = `[[page:${mark.value}]]`;
          } else {
            replacement = `[[${mark.value}]]`;
          }
        }
        break;
      default:
        replacement = content;
    }
    
    result = result.substring(0, mark.start) + replacement + result.substring(mark.end);
  }
  
  return result;
}

/**
 * Updates a line with new markdown text
 */
export function updateLineWithMarkdown(line: Line, newMarkdownText: string): Line {
  const { displayText, marks } = markdownToRichText(newMarkdownText);
  
  return {
    ...line,
    markdownText: newMarkdownText,
    displayText,
    text: displayText, // Legacy support
    marks,
    createdAt: new Date(),
    createdBy: 'human'
  };
}

/**
 * Creates a new line from markdown text
 */
export function createLineFromMarkdown(markdownText: string, id: string): Line {
  const { displayText, marks } = markdownToRichText(markdownText);
  
  return {
    id,
    markdownText,
    displayText,
    text: displayText, // Legacy support
    marks,
    pageNumber: 1,
    lineOnPage: 1,
    createdAt: new Date(),
    createdBy: 'human'
  };
}