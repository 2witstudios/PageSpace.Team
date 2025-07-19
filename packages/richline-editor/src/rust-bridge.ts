import init, { Document, BreakType, wrap_text } from '../pkg/rust_core.js';
import { Line, LinesInput, normalizeLines } from './types';

let wasmReady: Promise<void> | null = null;

export const initializeWasm = (): Promise<void> => {
  if (wasmReady === null) {
    wasmReady = init().then(() => {
      console.log('WASM module initialized.');
    }).catch(console.error);
  }
  return wasmReady;
};

export class RichlineCore {
  private doc: Document;

  constructor(initialLines: LinesInput = []) {
    this.doc = new Document();
    const normalized = normalizeLines(initialLines);
    this.doc.setFromMarkdown(normalized.map((l: Line) => ({ markdown_text: l.text, break_type: l.breakType })));
  }

  public getLines(): LinesInput {
    try {
      return this.doc.getLines();
    } catch (e) {
      console.error("Error getting lines:", e);
      return [];
    }
  }

  public replaceLines(startIndex: number, endIndex: number, newLines: LinesInput): void {
    const normalized = normalizeLines(newLines);
    this.doc.replaceLines(startIndex, endIndex, normalized.map((l: Line) => ({ text: l.text, break_type: l.breakType })));
  }

  public static wrapText(text: string, maxChars: number): LinesInput {
    const wrappedFromWasm = wrap_text(text, maxChars) as any[];
    return wrappedFromWasm.map(l => ({ text: l.markdown_text, breakType: l.break_type }));
  }
}