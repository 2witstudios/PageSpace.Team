import { Line } from '@/components/ai-editor/types';
import { createLineFromMarkdown } from './markdown-conversion';
import { v4 as uuidv4 } from 'uuid';

/**
 * Processes AI-generated content with markdown formatting and converts it to lines
 * The AI can return multiple paragraphs and the system will split them appropriately
 */
export function processAIContentToLines(
  aiContent: string,
  parentLineId?: string,
  charsPerLine: number = 120
): Line[] {
  // First, split content by paragraphs (double newlines)
  const paragraphs = aiContent.split(/\n\s*\n/).filter(p => p.trim());
  
  const lines: Line[] = [];
  
  for (const paragraph of paragraphs) {
    // For each paragraph, split into lines respecting the character limit
    const paragraphLines = splitParagraphIntoLines(paragraph.trim(), charsPerLine);
    
    for (const lineText of paragraphLines) {
      const line = createLineFromMarkdown(lineText, uuidv4());
      line.pageNumber = 0; // Will be recalculated
      line.lineOnPage = 0; // Will be recalculated  
      line.createdBy = 'ai';
      if (parentLineId) {
        line.parentId = parentLineId;
      }
      lines.push(line);
    }
  }
  
  return lines;
}

/**
 * Splits a paragraph into lines while respecting character limits and markdown syntax
 */
function splitParagraphIntoLines(paragraph: string, charsPerLine: number): string[] {
  if (paragraph.length <= charsPerLine) {
    return [paragraph];
  }
  
  const lines: string[] = [];
  let currentLine = '';
  const words = paragraph.split(' ');
  
  for (const word of words) {
    // Check if adding this word would exceed the limit
    const potentialLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (potentialLine.length <= charsPerLine) {
      currentLine = potentialLine;
    } else {
      // If current line has content, save it and start a new line
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word itself is too long, force break it
        if (word.length > charsPerLine) {
          const chunks = breakLongWord(word, charsPerLine);
          lines.push(...chunks.slice(0, -1));
          currentLine = chunks[chunks.length - 1];
        } else {
          currentLine = word;
        }
      }
    }
  }
  
  // Add the last line if it has content
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Breaks a long word into chunks that fit within the character limit
 * Tries to preserve markdown syntax where possible
 */
function breakLongWord(word: string, charsPerLine: number): string[] {
  const chunks: string[] = [];
  let remaining = word;
  
  while (remaining.length > charsPerLine) {
    // Try to find a good break point (avoid breaking markdown syntax)
    let breakPoint = charsPerLine;
    
    // Look for safe break points (spaces, punctuation, after markdown syntax)
    for (let i = charsPerLine - 1; i >= charsPerLine * 0.8; i--) {
      const char = remaining[i];
      if (char === ' ' || char === '-' || char === '.' || char === ',' || 
          char === ')' || char === ']' || char === '}') {
        breakPoint = i + 1;
        break;
      }
    }
    
    chunks.push(remaining.substring(0, breakPoint));
    remaining = remaining.substring(breakPoint);
  }
  
  if (remaining) {
    chunks.push(remaining);
  }
  
  return chunks;
}

/**
 * Extracts lines from a line range as markdown text for AI processing
 */
export function extractLinesForAI(lines: Line[], startLine: number, endLine: number): string {
  if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
    throw new Error(`Invalid line range: ${startLine}-${endLine} (total lines: ${lines.length})`);
  }
  
  const selectedLines = lines.slice(startLine, endLine + 1);
  return selectedLines.map(line => line.markdownText).join('\n');
}

/**
 * Validates AI response format and content
 */
export function validateAIResponse(response: string, maxCharsPerLine: number): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!response || response.trim().length === 0) {
    errors.push('AI response is empty');
    return { valid: false, errors, warnings };
  }
  
  // Check for extremely long lines that might cause display issues
  const lines = response.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > maxCharsPerLine * 2) {
      warnings.push(`Line ${i + 1} is very long (${line.length} chars) and may need manual wrapping`);
    }
  }
  
  // Check for malformed markdown syntax
  const markdownPatterns = [
    { pattern: /\*\*[^*]*\*(?!\*)/g, error: 'Unmatched bold syntax (**)' },
    { pattern: /\*[^*]*(?<!\*)\*/g, error: 'Potentially malformed italic syntax (*)' },
    { pattern: /@user:[^\s]*[^\w]/g, error: 'Malformed user mention (@user:)' },
    { pattern: /\[\[page:[^\]]*(?<!\])\]/g, error: 'Malformed page mention ([[page:]])' },
  ];
  
  for (const { pattern, error } of markdownPatterns) {
    if (pattern.test(response)) {
      warnings.push(error);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formats AI content for display in merge preview
 */
export function formatAIContentPreview(content: string, maxLines: number = 10): string {
  const lines = content.split('\n');
  
  if (lines.length <= maxLines) {
    return content;
  }
  
  const previewLines = lines.slice(0, maxLines);
  const remainingCount = lines.length - maxLines;
  
  return previewLines.join('\n') + `\n... (${remainingCount} more lines)`;
}