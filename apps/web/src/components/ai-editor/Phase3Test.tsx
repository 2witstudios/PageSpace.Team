import React, { useState } from 'react';
import { parseMarkdown, createStableMention } from '@/lib/markdown-parser';
import { mentionService } from '@/lib/mention-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

/**
 * Comprehensive test component for Phase 3: Mentions & Formatting
 * Tests all the requirements from the PRD
 */
const Phase3Test: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testText, setTestText] = useState('Hello **world** and _italic text_ with @user:1 and [[page:2]]!');

  const addResult = (test: string, success: boolean, details?: string) => {
    const result = `${test}: ${success ? '✅ PASS' : '❌ FAIL'} ${details || ''}`;
    setTestResults(prev => [...prev, result]);
  };

  const runAllTests = async () => {
    setTestResults([]);

    // Test 1: Markdown-lite parsing for **bold** and _italic_
    const basicMarkdown = '**bold text** and _italic text_';
    const marks = parseMarkdown(basicMarkdown);
    const boldMark = marks.find(m => m.type === 'bold');
    const italicMark = marks.find(m => m.type === 'italic');
    addResult(
      'Markdown-lite parsing', 
      !!boldMark && !!italicMark,
      `Found ${marks.length} marks`
    );

    // Test 2: Mention system with stable IDs
    const mentionText = '@user:123 and [[page:456]] with legacy @username and [[Page Title]]';
    const mentionMarks = parseMarkdown(mentionText);
    const mentionCount = mentionMarks.filter(m => m.type === 'mention').length;
    addResult(
      'Mention system parsing',
      mentionCount === 4,
      `Found ${mentionCount} mentions`
    );

    // Test 3: Stable ID format validation
    const stableUserMention = createStableMention({ id: '123', name: 'John Doe', type: 'user' });
    const stablePageMention = createStableMention({ id: '456', name: 'Project Plan', type: 'page' });
    addResult(
      'Stable ID creation',
      stableUserMention === '@user:123' && stablePageMention === '[[page:456]]',
      `User: ${stableUserMention}, Page: ${stablePageMention}`
    );

    // Test 4: Mention metadata extraction
    const stableMentionMarks = parseMarkdown('@user:123 and [[page:456]]');
    const userMention = stableMentionMarks.find(m => m.metadata?.mentionType === 'user');
    const pageMention = stableMentionMarks.find(m => m.metadata?.mentionType === 'page');
    addResult(
      'Mention metadata extraction',
      userMention?.metadata?.isStableId === true && pageMention?.metadata?.isStableId === true,
      `User ID: ${userMention?.metadata?.mentionId}, Page ID: ${pageMention?.metadata?.mentionId}`
    );

    // Test 5: Tiered search functionality
    try {
      const searchResults = await mentionService.searchMentions('john');
      addResult(
        'Tiered search',
        searchResults.length > 0,
        `Found ${searchResults.length} results`
      );
    } catch (error) {
      addResult('Tiered search', false, `Error: ${error}`);
    }

    // Test 6: Mention caching
    const cacheStats = mentionService.getCacheStats();
    addResult(
      'Mention caching',
      typeof cacheStats.recent === 'number',
      `Cache: ${cacheStats.recent} recent, ${cacheStats.global} global`
    );

    // Test 7: Complex markdown with mentions
    const complexText = '**Important:** Contact @user:1 about the [[page:2]] project. _Note:_ Check with @jane-doe too.';
    const complexMarks = parseMarkdown(complexText);
    const boldCount = complexMarks.filter(m => m.type === 'bold').length;
    const italicCount = complexMarks.filter(m => m.type === 'italic').length;
    const mentionComplexCount = complexMarks.filter(m => m.type === 'mention').length;
    addResult(
      'Complex formatting',
      boldCount === 1 && italicCount === 1 && mentionComplexCount === 3,
      `${boldCount} bold, ${italicCount} italic, ${mentionComplexCount} mentions`
    );

    // Test 8: Mention resolution
    try {
      const resolvedName = await mentionService.resolveMention('1', 'user');
      addResult(
        'Mention resolution',
        resolvedName.includes('@'),
        `Resolved to: ${resolvedName}`
      );
    } catch (error) {
      addResult('Mention resolution', false, `Error: ${error}`);
    }

    // Test 9: Legacy format support
    const legacyText = '@username and [[Page Title]]';
    const legacyMarks = parseMarkdown(legacyText);
    const legacyMentions = legacyMarks.filter(m => m.type === 'mention');
    addResult(
      'Legacy format support',
      legacyMentions.length === 2 && !legacyMentions[0].metadata?.isStableId,
      `Found ${legacyMentions.length} legacy mentions`
    );

    // Test 10: API integration
    try {
      const response = await fetch('/api/mentions/search?q=john');
      const data = await response.json();
      addResult(
        'API integration',
        response.ok && (data.users?.length > 0 || data.pages?.length > 0),
        `API returned ${data.users?.length || 0} users, ${data.pages?.length || 0} pages`
      );
    } catch (error) {
      addResult('API integration', false, `Error: ${error}`);
    }
  };

  const testCustomText = () => {
    setTestResults([]);
    const marks = parseMarkdown(testText);
    addResult(
      'Custom text parsing',
      marks.length > 0,
      `Found ${marks.length} marks: ${marks.map(m => m.type).join(', ')}`
    );
    
    marks.forEach((mark, index) => {
      const text = testText.substring(mark.start, mark.end);
      addResult(
        `Mark ${index + 1}`,
        true,
        `${mark.type}: "${text}" ${mark.metadata ? JSON.stringify(mark.metadata) : ''}`
      );
    });
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 3 Test Suite: Mentions & Formatting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runAllTests}>
              Run All Tests
            </Button>
            <Button variant="outline" onClick={() => setTestResults([])}>
              Clear Results
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Test Custom Text:</label>
            <div className="flex gap-2">
              <Input
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text with **bold**, _italic_, @user:123, [[page:456]]"
                className="flex-1"
              />
              <Button onClick={testCustomText} variant="outline">
                Parse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded text-sm font-mono ${
                    result.includes('✅') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Summary:</strong> {testResults.filter(r => r.includes('✅')).length} / {testResults.length} tests passed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Feature Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">✅ Implemented Features</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Markdown-lite parsing (**bold**, _italic_)</li>
                <li>• Stable ID mentions (@user:123, [[page:456]])</li>
                <li>• Legacy format support</li>
                <li>• Tiered search (recent, document, global)</li>
                <li>• Mention caching with expiration</li>
                <li>• Keyboard navigation in autocomplete</li>
                <li>• Real-time mention resolution</li>
                <li>• API endpoints for search & resolve</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🎯 Key Improvements</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• 300ms debounced search</li>
                <li>• Fuzzy matching with relevance scoring</li>
                <li>• Whitespace-insensitive parsing</li>
                <li>• Visual mention pills with type indicators</li>
                <li>• Automatic cache cleanup</li>
                <li>• Backward compatibility</li>
                <li>• Enhanced error handling</li>
                <li>• Performance optimizations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase3Test;