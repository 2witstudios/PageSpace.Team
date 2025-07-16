import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Line, Mark, MarkType } from '@/components/ai-editor/types';

/**
 * Converts a line with marks to DOCX TextRun elements
 */
function lineToDocxRuns(line: Line): TextRun[] {
  if (!line.marks || line.marks.length === 0) {
    return [new TextRun(line.text)];
  }

  const runs: TextRun[] = [];
  const sortedMarks = [...line.marks].sort((a, b) => a.start - b.start);
  
  let currentPos = 0;
  
  // Process text segments between marks
  for (const mark of sortedMarks) {
    // Add text before the mark
    if (mark.start > currentPos) {
      const text = line.text.substring(currentPos, mark.start);
      runs.push(new TextRun(text));
    }

    // Add the marked text
    const markedText = line.text.substring(mark.start, mark.end);
    const textRun = createFormattedTextRun(markedText, mark);
    runs.push(textRun);

    currentPos = mark.end;
  }

  // Add remaining text after the last mark
  if (currentPos < line.text.length) {
    const remainingText = line.text.substring(currentPos);
    runs.push(new TextRun(remainingText));
  }

  return runs.length > 0 ? runs : [new TextRun(line.text)];
}

/**
 * Creates a formatted TextRun based on mark type
 */
function createFormattedTextRun(text: string, mark: Mark): TextRun {
  const formatting: {
    bold?: boolean;
    italics?: boolean;
    color?: string;
  } = {};

  switch (mark.type) {
    case MarkType.Bold:
      formatting.bold = true;
      break;
    case MarkType.Italic:
      formatting.italics = true;
      break;
    case MarkType.Mention:
      formatting.bold = true;
      formatting.color = '0066CC'; // Blue color for mentions
      // For mentions, use the display name if available
      if (mark.displayName) {
        text = mark.displayName;
      }
      break;
  }

  return new TextRun({
    text,
    ...formatting,
  });
}

/**
 * Handles overlapping marks by merging formatting
 */
function mergeOverlappingMarks(marks: Mark[]): Mark[] {
  if (marks.length <= 1) return marks;

  const merged: Mark[] = [];
  const sorted = [...marks].sort((a, b) => a.start - b.start);

  for (const mark of sorted) {
    const overlapping = merged.filter(m => 
      m.start < mark.end && m.end > mark.start
    );

    if (overlapping.length === 0) {
      merged.push(mark);
    } else {
      // For now, just add non-overlapping marks to keep it simple
      // In a full implementation, you'd merge the formatting properties
      const hasConflict = overlapping.some(m => 
        m.start === mark.start && m.end === mark.end
      );
      
      if (!hasConflict) {
        merged.push(mark);
      }
    }
  }

  return merged;
}

export const exportToDocx = (lines: Line[], fileName: string = 'document') => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: lines.map(line => {
        const processedMarks = line.marks ? mergeOverlappingMarks(line.marks) : [];
        const lineWithProcessedMarks = { ...line, marks: processedMarks };
        
        return new Paragraph({
          children: lineToDocxRuns(lineWithProcessedMarks),
        });
      }),
    }],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `${fileName}.docx`);
  });
};