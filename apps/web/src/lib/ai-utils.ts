export enum AIErrorType {
  INVALID_RANGE = 'invalid_range',
  MALFORMED_XML = 'malformed_xml',
  CONTENT_TOO_LONG = 'content_too_long',
  CONTENT_MISMATCH = 'content_mismatch',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit'
}

export interface AIRewriteValidation {
  success: boolean;
  error?: {
    type: AIErrorType;
    message: string;
  };
  parsed?: {
    startLine: number;
    endLine: number;
    original: string;
    replacement: string;
  };
}

/**
 * Normalizes whitespace for content comparison.
 * Converts multiple whitespace chars to single spaces and trims.
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Validates that a rewrite doesn't exceed character limits per line.
 */
function validateCharacterLimits(text: string, charsPerLine: number): boolean {
  const lines = text.split('\n');
  return lines.every(line => line.length <= charsPerLine);
}

/**
 * Parses and validates the AI's response using the full XML schema.
 * Supports both simple <replace>content</replace> and full format:
 * <replace start_line="X" end_line="Y">
 *   <original>original content</original>
 *   <replacement>new content</replacement>
 * </replace>
 * 
 * @param responseText The raw text response from the AI
 * @param originalText The original text being replaced (for verification)
 * @param startLine The expected start line index
 * @param endLine The expected end line index
 * @param charsPerLine Character limit per line
 * @returns Validation result with parsed content or error details
 */
export function parseAndValidateRewriteResponse(
  responseText: string,
  originalText: string,
  startLine: number,
  endLine: number,
  charsPerLine: number
): AIRewriteValidation {
  // First try the full XML format with attributes
  const fullFormatMatch = responseText.match(
    /<replace\s+start_line="(\d+)"\s+end_line="(\d+)">([\s\S]*?)<\/replace>/
  );

  if (fullFormatMatch) {
    const [, startLineStr, endLineStr, innerContent] = fullFormatMatch;
    const parsedStartLine = parseInt(startLineStr, 10);
    const parsedEndLine = parseInt(endLineStr, 10);

    // Validate line range attributes match expected values
    if (parsedStartLine !== startLine || parsedEndLine !== endLine) {
      return {
        success: false,
        error: {
          type: AIErrorType.INVALID_RANGE,
          message: `Line range mismatch: expected ${startLine}-${endLine}, got ${parsedStartLine}-${parsedEndLine}`
        }
      };
    }

    // Parse original and replacement tags
    const originalMatch = innerContent.match(/<original>([\s\S]*?)<\/original>/);
    const replacementMatch = innerContent.match(/<replacement>([\s\S]*?)<\/replacement>/);

    if (!originalMatch || !replacementMatch) {
      return {
        success: false,
        error: {
          type: AIErrorType.MALFORMED_XML,
          message: 'Missing <original> or <replacement> tags within <replace>'
        }
      };
    }

    const original = originalMatch[1];
    const replacement = replacementMatch[1];

    // Validate original content matches (whitespace-insensitive)
    if (normalizeWhitespace(original) !== normalizeWhitespace(originalText)) {
      return {
        success: false,
        error: {
          type: AIErrorType.CONTENT_MISMATCH,
          message: 'Original content in AI response does not match expected content'
        }
      };
    }

    // Validate character limits
    if (!validateCharacterLimits(replacement, charsPerLine)) {
      return {
        success: false,
        error: {
          type: AIErrorType.CONTENT_TOO_LONG,
          message: `Replacement text exceeds character limit of ${charsPerLine} per line`
        }
      };
    }

    return {
      success: true,
      parsed: {
        startLine: parsedStartLine,
        endLine: parsedEndLine,
        original,
        replacement
      }
    };
  }

  // Fallback to simple format for backward compatibility
  const simpleMatch = responseText.match(/<replace>([\s\S]*?)<\/replace>/);
  if (simpleMatch) {
    const replacement = simpleMatch[1];

    // Validate character limits
    if (!validateCharacterLimits(replacement, charsPerLine)) {
      return {
        success: false,
        error: {
          type: AIErrorType.CONTENT_TOO_LONG,
          message: `Replacement text exceeds character limit of ${charsPerLine} per line`
        }
      };
    }

    return {
      success: true,
      parsed: {
        startLine,
        endLine,
        original: originalText,
        replacement
      }
    };
  }

  return {
    success: false,
    error: {
      type: AIErrorType.MALFORMED_XML,
      message: 'No valid <replace> tag found in AI response'
    }
  };
}

/**
 * Legacy function for backward compatibility.
 * @deprecated Use parseAndValidateRewriteResponse instead
 */
export function parseRewriteResponse(responseText: string): string | null {
  const match = responseText.match(/<replace>([\s\S]*?)<\/replace>/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}