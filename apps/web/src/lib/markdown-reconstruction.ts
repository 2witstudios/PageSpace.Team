import { Line, Mark, MarkType } from '@/components/ai-editor/types';

/**
 * Reconstructs markdown text from a line with marks
 */
export function lineToMarkdown(line: Line): string {
  if (!line.marks || line.marks.length === 0) {
    return line.text;
  }

  // Sort marks by start position to process them in order
  const sortedMarks = [...line.marks].sort((a, b) => a.start - b.start);
  
  let result = '';
  const markStack: Mark[] = [];

  // Process each character position
  for (let pos = 0; pos <= line.text.length; pos++) {
    // Check for marks ending at this position
    const endingMarks = markStack.filter(mark => mark.end === pos);
    endingMarks.forEach(mark => {
      result += getMarkdownSuffix(mark);
      const index = markStack.indexOf(mark);
      markStack.splice(index, 1);
    });

    // Check for marks starting at this position
    const startingMarks = sortedMarks.filter(mark => mark.start === pos);
    startingMarks.forEach(mark => {
      result += getMarkdownPrefix(mark);
      markStack.push(mark);
    });

    // Add the character if we haven't reached the end
    if (pos < line.text.length) {
      result += line.text[pos];
    }
  }

  return result;
}

/**
 * Converts multiple lines to markdown format
 */
export function linesToMarkdown(lines: Line[]): string {
  return lines.map(line => lineToMarkdown(line)).join('\n');
}

/**
 * Gets the markdown prefix for a mark type
 */
function getMarkdownPrefix(mark: Mark): string {
  switch (mark.type) {
    case MarkType.Bold:
      return '**';
    case MarkType.Italic:
      return '*';
    case MarkType.Mention:
      if (mark.metadata?.mentionType === 'user') {
        if (mark.metadata?.isStableId) {
          return `@user:${mark.value}`;
        } else {
          return `@${mark.value}`;
        }
      } else if (mark.metadata?.mentionType === 'page') {
        if (mark.metadata?.isStableId) {
          return `[[page:${mark.value}]]`;
        } else {
          return `[[${mark.value}]]`;
        }
      }
      return mark.value || '';
    default:
      return '';
  }
}

/**
 * Gets the markdown suffix for a mark type
 */
function getMarkdownSuffix(mark: Mark): string {
  switch (mark.type) {
    case MarkType.Bold:
      return '**';
    case MarkType.Italic:
      return '*';
    case MarkType.Mention:
      // Mentions are self-contained, no suffix needed
      return '';
    default:
      return '';
  }
}

/**
 * Handles overlapping marks by prioritizing certain types
 */
export function normalizeMarks(marks: Mark[]): Mark[] {
  if (marks.length <= 1) return marks;

  // Sort marks by start position, then by priority (mentions > bold > italic)
  const priority = { [MarkType.Mention]: 3, [MarkType.Bold]: 2, [MarkType.Italic]: 1 };
  
  return marks.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (priority[b.type] || 0) - (priority[a.type] || 0);
  });
}

/**
 * Validates that marks don't overlap improperly
 */
export function validateMarks(marks: Mark[], textLength: number): Mark[] {
  return marks.filter(mark => 
    mark.start >= 0 && 
    mark.end <= textLength && 
    mark.start < mark.end
  );
}

/**
 * Extracts markdown formatting from selected text across multiple lines
 */
export function extractMarkdownFromSelection(
  lines: Line[],
  startLine: number,
  startChar: number,
  endLine: number,
  endChar: number
): string {
  let result = '';

  for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
    const line = lines[lineIndex];
    if (!line) continue;

    let lineStart = 0;
    let lineEnd = line.text.length;

    // Adjust for selection bounds
    if (lineIndex === startLine) {
      lineStart = startChar;
    }
    if (lineIndex === endLine) {
      lineEnd = endChar;
    }

    // Extract only marks that fall within the selection
    const relevantMarks = (line.marks || []).filter(mark => 
      mark.start < lineEnd && mark.end > lineStart
    ).map(mark => ({
      ...mark,
      start: Math.max(mark.start - lineStart, 0),
      end: Math.min(mark.end - lineStart, lineEnd - lineStart)
    }));

    const selectedText = line.text.substring(lineStart, lineEnd);
    const lineWithMarks: Line = {
      ...line,
      text: selectedText,
      marks: relevantMarks
    };

    const markdownLine = lineToMarkdown(lineWithMarks);
    
    if (lineIndex > startLine) {
      result += '\n';
    }
    result += markdownLine;
  }

  return result;
}