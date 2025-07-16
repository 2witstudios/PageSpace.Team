import { Mark, MarkType } from '@/components/ai-editor/types';
import { mentionService } from './mention-service';

const BOLD_REGEX = /\*\*(.*?)\*\*/g;
const ITALIC_REGEX = /_(.*?)_/g;
// Enhanced regex to capture both legacy and stable ID formats
const MENTION_REGEX = /@(?:user:([^:\s]+)|(\w+))|\[\[(?:page:([^:\]]+)|([^\]]+))\]\]/g;

export const parseMarkdown = (text: string): Mark[] => {
  const marks: Mark[] = [];
  let match;

  // Reset regex state
  BOLD_REGEX.lastIndex = 0;
  ITALIC_REGEX.lastIndex = 0;
  MENTION_REGEX.lastIndex = 0;

  while ((match = BOLD_REGEX.exec(text)) !== null) {
    marks.push({
      type: MarkType.Bold,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  while ((match = ITALIC_REGEX.exec(text)) !== null) {
    marks.push({
      type: MarkType.Italic,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    let mentionType: 'user' | 'page';
    let mentionId: string;
    let mentionValue: string;

    if (match[1]) {
      // Stable user ID format: @user:123
      mentionType = 'user';
      mentionId = match[1];
      mentionValue = `user:${mentionId}`;
    } else if (match[2]) {
      // Legacy user format: @username
      mentionType = 'user';
      mentionId = match[2];
      mentionValue = match[2]; // Store as-is for backward compatibility
    } else if (match[3]) {
      // Stable page ID format: [[page:123]]
      mentionType = 'page';
      mentionId = match[3];
      mentionValue = `page:${mentionId}`;
    } else if (match[4]) {
      // Legacy page format: [[Page Title]]
      mentionType = 'page';
      mentionId = match[4];
      mentionValue = match[4]; // Store as-is for backward compatibility
    } else {
      continue; // Skip invalid matches
    }

    marks.push({
      type: MarkType.Mention,
      start: match.index,
      end: match.index + match[0].length,
      value: mentionValue,
      metadata: {
        mentionType,
        mentionId,
        isStableId: mentionValue.includes(':'),
      },
    });
  }

  return marks.sort((a, b) => a.start - b.start);
};

/**
 * Resolves mention marks to display names using the mention service
 */
export const resolveMentionMarks = async (marks: Mark[]): Promise<Mark[]> => {
  const resolvedMarks = await Promise.all(
    marks.map(async (mark) => {
      if (mark.type !== MarkType.Mention || !mark.metadata?.isStableId) {
        return mark;
      }

      try {
        const displayName = await mentionService.resolveMention(
          mark.metadata.mentionId!,
          mark.metadata.mentionType!
        );
        
        return {
          ...mark,
          displayName,
        };
      } catch (error) {
        console.error('Failed to resolve mention:', error);
        return mark;
      }
    })
  );

  return resolvedMarks;
};

/**
 * Converts a mention selection to stable ID format
 */
export const createStableMention = (entity: { id: string; name: string; type: 'user' | 'page' }): string => {
  if (entity.type === 'user') {
    return `@user:${entity.id}`;
  } else {
    return `[[page:${entity.id}]]`;
  }
};