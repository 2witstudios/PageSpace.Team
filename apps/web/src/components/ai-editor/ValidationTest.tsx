import React, { useState } from 'react';
import { parseAndValidateRewriteResponse, AIErrorType } from '@/lib/ai-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test component to verify AI rewrite validation works correctly.
 * This component tests all the error scenarios from the PRD.
 */
const ValidationTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (test: string, success: boolean, message?: string) => {
    const result = `${test}: ${success ? '✅ PASS' : '❌ FAIL'} ${message || ''}`;
    setResults(prev => [...prev, result]);
  };

  const runTests = () => {
    setResults([]);

    // Test 1: Valid full XML format
    const validXML = `<replace start_line="0" end_line="1">
<original>
This is original text.
Second line here.
</original>
<replacement>
This is improved text.
Second line improved.
</replacement>
</replace>`;
    
    const result1 = parseAndValidateRewriteResponse(
      validXML,
      'This is original text.\nSecond line here.',
      0,
      1,
      80
    );
    addResult('Valid XML Format', result1.success);

    // Test 2: Line range mismatch
    const result2 = parseAndValidateRewriteResponse(
      validXML,
      'This is original text.\nSecond line here.',
      0,
      2, // Wrong end line
      80
    );
    addResult('Line Range Mismatch', !result2.success && result2.error?.type === AIErrorType.INVALID_RANGE);

    // Test 3: Content mismatch
    const result3 = parseAndValidateRewriteResponse(
      validXML,
      'Different original text.\nSecond line here.',
      0,
      1,
      80
    );
    addResult('Content Mismatch', !result3.success && result3.error?.type === AIErrorType.CONTENT_MISMATCH);

    // Test 4: Character limit exceeded
    const longLineXML = `<replace start_line="0" end_line="0">
<original>
Short text.
</original>
<replacement>
This is a very long line that definitely exceeds the character limit that we have set for this test which should be much shorter than this.
</replacement>
</replace>`;
    
    const result4 = parseAndValidateRewriteResponse(
      longLineXML,
      'Short text.',
      0,
      0,
      50 // Short limit
    );
    addResult('Character Limit Exceeded', !result4.success && result4.error?.type === AIErrorType.CONTENT_TOO_LONG);

    // Test 5: Malformed XML - Missing tags
    const malformedXML = `<replace start_line="0" end_line="0">
<original>
Original text.
</original>
</replace>`;
    
    const result5 = parseAndValidateRewriteResponse(
      malformedXML,
      'Original text.',
      0,
      0,
      80
    );
    addResult('Malformed XML (Missing replacement)', !result5.success && result5.error?.type === AIErrorType.MALFORMED_XML);

    // Test 6: No replace tag at all
    const noReplaceTag = 'Just some random text without any XML tags.';
    
    const result6 = parseAndValidateRewriteResponse(
      noReplaceTag,
      'Original text.',
      0,
      0,
      80
    );
    addResult('No Replace Tag', !result6.success && result6.error?.type === AIErrorType.MALFORMED_XML);

    // Test 7: Simple format (backward compatibility)
    const simpleXML = '<replace>Improved simple text.</replace>';
    
    const result7 = parseAndValidateRewriteResponse(
      simpleXML,
      'Original simple text.',
      0,
      0,
      80
    );
    addResult('Simple Format (Backward Compatibility)', result7.success);

    // Test 8: Whitespace tolerance
    const whitespaceXML = `<replace start_line="0" end_line="0">
<original>
   This    has   extra    spaces   
</original>
<replacement>
This has normal spaces.
</replacement>
</replace>`;
    
    const result8 = parseAndValidateRewriteResponse(
      whitespaceXML,
      'This has extra spaces', // No extra whitespace
      0,
      0,
      80
    );
    addResult('Whitespace Tolerance', result8.success);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>AI Validation Test Suite</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTests} className="mb-4">
          Run All Tests
        </Button>
        
        <div className="space-y-2">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-2 rounded text-sm font-mono ${
                result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {result}
            </div>
          ))}
        </div>
        
        {results.length > 0 && (
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-sm text-blue-800">
              <strong>Summary:</strong> {results.filter(r => r.includes('✅')).length} / {results.length} tests passed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationTest;