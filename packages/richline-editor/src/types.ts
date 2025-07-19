// Enhanced line interface with break metadata
export interface Line {
  id?: string;           // Optional stable ID for tracking/diffing
  text: string;
  breakType: 'Natural' | 'Whitespace' | 'Hard';
}

// Input can be either string array or Line array
export type LinesInput = string[] | Line[];

// Utility functions for line management
export const isLineArray = (lines: LinesInput): lines is Line[] => {
  return lines.length > 0 && typeof lines[0] === 'object' && 'text' in lines[0];
};

export const linesToStrings = (lines: LinesInput): string[] => {
  return isLineArray(lines) ? lines.map(l => l.text) : lines;
};

export const stringsToLines = (strings: string[]): Line[] => {
  return strings.map(text => ({ text, breakType: 'Natural' as const }));
};

export const normalizeLines = (lines: LinesInput): Line[] => {
  return isLineArray(lines) ? lines : stringsToLines(lines);
};