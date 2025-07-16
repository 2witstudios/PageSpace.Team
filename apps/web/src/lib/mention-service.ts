export interface MentionEntity {
  id: string;
  name: string;
  type: 'user' | 'page';
  lastUsed?: Date;
}

export interface MentionCache {
  recent: MentionEntity[];
  document: Map<string, MentionEntity[]>; // documentId -> mentions
  global: Map<string, MentionEntity>; // entityId -> entity
}

class MentionService {
  private cache: MentionCache = {
    recent: [],
    document: new Map(),
    global: new Map(),
  };

  private readonly MAX_RECENT = 10;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Encodes a mention with stable internal ID
   */
  encodeMention(entity: MentionEntity): string {
    if (entity.type === 'user') {
      return `@user:${entity.id}`;
    } else {
      return `[[page:${entity.id}]]`;
    }
  }

  /**
   * Decodes a mention from stable internal ID format
   */
  decodeMention(mentionText: string): { type: 'user' | 'page'; id: string; displayText: string } | null {
    // Handle user mentions: @user:123 or @username
    const userMatch = mentionText.match(/^@(?:user:([^:]+)|(.+))$/);
    if (userMatch) {
      if (userMatch[1]) {
        // Stable ID format: @user:123
        return {
          type: 'user',
          id: userMatch[1],
          displayText: mentionText,
        };
      } else {
        // Legacy format: @username - try to resolve to ID
        return {
          type: 'user',
          id: userMatch[2], // Fallback to name as ID
          displayText: mentionText,
        };
      }
    }

    // Handle page mentions: [[page:123]] or [[Page Title]]
    const pageMatch = mentionText.match(/^\[\[(?:page:([^:]+)|(.+))\]\]$/);
    if (pageMatch) {
      if (pageMatch[1]) {
        // Stable ID format: [[page:123]]
        return {
          type: 'page',
          id: pageMatch[1],
          displayText: mentionText,
        };
      } else {
        // Legacy format: [[Page Title]] - try to resolve to ID
        return {
          type: 'page',
          id: pageMatch[2], // Fallback to name as ID
          displayText: mentionText,
        };
      }
    }

    return null;
  }

  /**
   * Resolves a mention ID to current display name
   */
  async resolveMention(mentionId: string, mentionType: 'user' | 'page'): Promise<string> {
    // Check cache first
    const cached = this.cache.global.get(`${mentionType}:${mentionId}`);
    if (cached) {
      return mentionType === 'user' ? `@${cached.name}` : `[[${cached.name}]]`;
    }

    try {
      // Fetch from API
      const response = await fetch(`/api/mentions/resolve?type=${mentionType}&id=${mentionId}`);
      const entity = await response.json();
      
      if (entity) {
        // Cache the resolved entity
        this.cache.global.set(`${mentionType}:${mentionId}`, {
          id: mentionId,
          name: entity.name,
          type: mentionType,
        });
        
        return mentionType === 'user' ? `@${entity.name}` : `[[${entity.name}]]`;
      }
    } catch (error) {
      console.error('Failed to resolve mention:', error);
    }

    // Fallback to ID if resolution fails
    return mentionType === 'user' ? `@user:${mentionId}` : `[[page:${mentionId}]]`;
  }

  /**
   * Tiered search for mention suggestions
   */
  async searchMentions(query: string, documentId?: string): Promise<MentionEntity[]> {
    const results: MentionEntity[] = [];
    const seen = new Set<string>();

    // Strategy 1: Recent mentions (highest priority)
    const recentMatches = this.cache.recent.filter(entity =>
      entity.name.toLowerCase().includes(query.toLowerCase())
    );
    
    for (const entity of recentMatches.slice(0, 3)) {
      const key = `${entity.type}:${entity.id}`;
      if (!seen.has(key)) {
        results.push(entity);
        seen.add(key);
      }
    }

    // Strategy 2: Same document mentions (medium priority)
    if (documentId) {
      const documentMentions = this.cache.document.get(documentId) || [];
      const documentMatches = documentMentions.filter(entity =>
        entity.name.toLowerCase().includes(query.toLowerCase())
      );
      
      for (const entity of documentMatches.slice(0, 4)) {
        const key = `${entity.type}:${entity.id}`;
        if (!seen.has(key)) {
          results.push(entity);
          seen.add(key);
        }
      }
    }

    // Strategy 3: Global fuzzy search (lowest priority)
    if (results.length < 8) {
      try {
        const response = await fetch(`/api/mentions/search?q=${encodeURIComponent(query)}&limit=${10 - results.length}`);
        const data = await response.json();
        
        const globalResults: MentionEntity[] = [
          ...data.users.map((u: { id: string; name: string }) => ({ ...u, type: 'user' as const })),
          ...data.pages.map((p: { id: string; title: string }) => ({ id: p.id, name: p.title, type: 'page' as const })),
        ];

        for (const entity of globalResults) {
          const key = `${entity.type}:${entity.id}`;
          if (!seen.has(key)) {
            results.push(entity);
            seen.add(key);
            
            // Cache globally for future use
            this.cache.global.set(key, entity);
          }
        }
      } catch (error) {
        console.error('Global mention search failed:', error);
      }
    }

    return results.slice(0, 10); // Maximum 10 results
  }

  /**
   * Records a mention usage for caching
   */
  recordMentionUsage(entity: MentionEntity, documentId?: string): void {
    // Update recent mentions
    this.cache.recent = this.cache.recent.filter(e => 
      !(e.type === entity.type && e.id === entity.id)
    );
    this.cache.recent.unshift({ ...entity, lastUsed: new Date() });
    this.cache.recent = this.cache.recent.slice(0, this.MAX_RECENT);

    // Update document-specific mentions
    if (documentId) {
      const documentMentions = this.cache.document.get(documentId) || [];
      const filtered = documentMentions.filter(e => 
        !(e.type === entity.type && e.id === entity.id)
      );
      filtered.unshift(entity);
      this.cache.document.set(documentId, filtered.slice(0, this.MAX_RECENT));
    }

    // Update global cache
    this.cache.global.set(`${entity.type}:${entity.id}`, entity);
  }

  /**
   * Clears expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    
    // Clear expired recent mentions
    this.cache.recent = this.cache.recent.filter(entity => {
      if (!entity.lastUsed) return true;
      return (now - entity.lastUsed.getTime()) < this.CACHE_DURATION;
    });

    // Clear expired global cache
    for (const [key, entity] of this.cache.global.entries()) {
      if (entity.lastUsed && (now - entity.lastUsed.getTime()) >= this.CACHE_DURATION) {
        this.cache.global.delete(key);
      }
    }
  }

  /**
   * Gets current cache stats for debugging
   */
  getCacheStats() {
    return {
      recent: this.cache.recent.length,
      documents: this.cache.document.size,
      global: this.cache.global.size,
    };
  }
}

// Singleton instance
export const mentionService = new MentionService();

// Auto-clear expired cache every 5 minutes
setInterval(() => {
  mentionService.clearExpiredCache();
}, 5 * 60 * 1000);