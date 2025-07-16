import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalText, prompt, startLine, endLine } = body;

    if (!originalText || !prompt || startLine === undefined || endLine === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: originalText, prompt, startLine, endLine' },
        { status: 400 }
      );
    }

    // Validate line range
    if (startLine < 0 || endLine < startLine) {
      return NextResponse.json(
        { error: 'Invalid line range: startLine must be >= 0 and endLine must be >= startLine' },
        { status: 400 }
      );
    }

    try {
      // TODO: Replace with actual Ollama integration
      // For now, using enhanced mock that follows the full XML schema
      
      // Create a more sophisticated mock response based on the prompt
      let mockReplacement = originalText;
      
      if (prompt.toLowerCase().includes('improve') || prompt.toLowerCase().includes('clarity')) {
        // Simple improvement: capitalize first letter of each line and ensure proper punctuation
        mockReplacement = originalText.split('\n').map((line: string) => {
          if (line.trim()) {
            let improved = line.trim();
            improved = improved.charAt(0).toUpperCase() + improved.slice(1);
            if (!improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
              improved += '.';
            }
            return improved;
          }
          return line;
        }).join('\n');
      } else if (prompt.toLowerCase().includes('shorten') || prompt.toLowerCase().includes('concise')) {
        // Shorten by removing redundant words
        mockReplacement = originalText.replace(/\b(very|really|quite|pretty|rather|extremely)\s+/gi, '');
      } else if (prompt.toLowerCase().includes('formal')) {
        // Make more formal
        mockReplacement = originalText
          .replace(/\bcan't\b/gi, 'cannot')
          .replace(/\bdon't\b/gi, 'do not')
          .replace(/\bwon't\b/gi, 'will not');
      }

      const mockResponse = `<replace start_line="${startLine}" end_line="${endLine}">
<original>
${originalText}
</original>
<replacement>
${mockReplacement}
</replacement>
</replace>`;

      // Simulate realistic AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      return NextResponse.json({ suggestedText: mockResponse });

    } catch (aiError: unknown) {
      console.error('AI processing error:', aiError);
      
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Error in AI rewrite route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}