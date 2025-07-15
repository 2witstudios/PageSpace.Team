import type { JSONContent } from '@tiptap/core';
import type { Page } from './types';

// TODO: Implement a proper Tiptap JSON to plain text converter.
function convertTiptapJsonToPlainText(jsonContent: JSONContent): string {
  // This is a temporary placeholder implementation.
  return JSON.stringify(jsonContent, null, 2);
}

/**
 * Formats the content of a given page for AI consumption.
 * @param page The page object to format content from.
 * @returns A formatted string of the page's content.
 */
export function getPageContentForAI(page: Page & { channelMessages?: any[], children?: any[] }): string {
    if (!page) {
        return `[Page not found.]`;
    }

    let contentString = `--- Start of Context from Page: "${page.title}" (Type: ${page.type}) ---\n`;

    switch (page.type) {
        case 'DOCUMENT':
            if (page.content) {
                contentString += convertTiptapJsonToPlainText(page.content as JSONContent);
            } else {
                contentString += "No document content available.\n";
            }
            break;
        case 'CHANNEL':
            if (page.channelMessages && page.channelMessages.length > 0) {
                contentString += "Channel Messages:\n";
                page.channelMessages.forEach((msg: any) => {
                    contentString += `- ${msg.user?.name || 'Unknown'}: ${msg.content}\n`;
                });
            } else {
                contentString += "No channel messages available.\n";
            }
            break;
        case 'FOLDER':
            if (page.children && page.children.length > 0) {
                contentString += "Folder Contents (Titles):\n";
                page.children.forEach((child: any) => {
                    contentString += `- ${child.title} (Type: ${child.type})\n`;
                });
            } else {
                contentString += "Folder is empty.\n";
            }
            break;
        default:
            contentString += `Content extraction not implemented for page type: ${page.type}.\n`;
    }

    contentString += `\n--- End of Context from Page: "${page.title}" ---\n`;
    return contentString;
}