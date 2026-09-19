import { Injectable } from '@angular/core';
import { AiService } from './ai.service';
import { INoteModel, NotesService } from './notes.service';
import { CostTrackerService } from './cost-tracker.service';

export interface SemanticSearchResult {
  note: INoteModel;
  score: number; // 0 to 1 cosine similarity
}

export interface RagAnswer {
  answer: string;
  sources: Array<{ id: number; title: string; score: number }>;
}

interface CachedEmbedding {
  noteId: number;
  contentHash: string;
  embedding: number[];
}

@Injectable({
  providedIn: 'root',
})
export class RagService {
  private readonly CACHE_KEY = 'notes_embeddings_cache_v2';
  private embeddingsCache: Map<number, CachedEmbedding> = new Map();

  constructor(
    private aiService: AiService,
    private notesService: NotesService,
    private costTracker: CostTrackerService
  ) {
    this.loadCache();
  }

  private loadCache(): void {
    const raw = localStorage.getItem(this.CACHE_KEY);
    if (raw) {
      try {
        const list: CachedEmbedding[] = JSON.parse(raw);
        for (const item of list) {
          this.embeddingsCache.set(item.noteId, item);
        }
      } catch (e) {
        console.warn('[RagService] Failed to load embeddings cache:', e);
      }
    }
  }

  private saveCache(): void {
    const list = Array.from(this.embeddingsCache.values());
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(list));
  }

  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  /**
   * Embed arbitrary text using Google Gemini gemini-embedding-001
   */
  async embedText(text: string): Promise<number[]> {
    const clean = text?.trim();
    if (!clean) return [];

    const key = this.aiService.getApiKey();
    if (!key) {
      throw new Error('Gemini API key is required to generate vector embeddings.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`;

    const body = {
      model: 'models/gemini-embedding-001',
      content: {
        parts: [{ text: clean }],
      },
    };

    const startTime = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `Embedding API error: ${res.status}`);
    }

    const data = await res.json();
    const inputTokens = Math.ceil(clean.length / 4);
    this.costTracker.recordQuery({
      operation: 'Vector Embedding',
      model: 'gemini-embedding-001',
      inputTokens,
      outputTokens: 0,
      latencyMs,
    });

    return data.embedding?.values || [];
  }

  /**
   * Calculates Cosine Similarity between two vectors: (A . B) / (|A| * |B|)
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Ensure embeddings exist for all current notes, caching them
   */
  private async indexNotes(notes: INoteModel[]): Promise<Map<number, number[]>> {
    const vectors = new Map<number, number[]>();
    let cacheChanged = false;

    for (const note of notes) {
      const text = `${note.title}\n${note.tags?.join(' ') || ''}\n${note.content || ''}`.trim();
      if (!text) continue;

      const hash = this.simpleHash(text);
      const cached = this.embeddingsCache.get(note.id);

      if (cached && cached.contentHash === hash) {
        vectors.set(note.id, cached.embedding);
      } else {
        // Generate new embedding
        try {
          const embedding = await this.embedText(text);
          if (embedding.length > 0) {
            this.embeddingsCache.set(note.id, {
              noteId: note.id,
              contentHash: hash,
              embedding,
            });
            vectors.set(note.id, embedding);
            cacheChanged = true;
          }
        } catch (err) {
          console.warn(`[RagService] Could not embed note #${note.id}:`, err);
        }
      }
    }

    if (cacheChanged) {
      this.saveCache();
    }

    return vectors;
  }

  /**
   * Perform Semantic Vector Search across notes using dense embeddings
   * Falls back gracefully to keyword matching if vector embedding encounters an error
   */
  async semanticSearch(query: string, topK = 4, threshold = 0.35): Promise<SemanticSearchResult[]> {
    if (!query?.trim()) return [];

    const notes = this.notesService.getNotes();
    if (!notes.length) return [];

    try {
      // 1. Embed user query
      const queryVector = await this.embedText(query.trim());
      if (!queryVector.length) {
        return this.keywordFallbackSearch(query, topK);
      }

      // 2. Ensure notes are indexed
      const noteVectors = await this.indexNotes(notes);

      // 3. Compute similarity and rank
      const results: SemanticSearchResult[] = [];

      for (const note of notes) {
        const noteVector = noteVectors.get(note.id);
        if (!noteVector) continue;

        const score = this.cosineSimilarity(queryVector, noteVector);
        if (score >= threshold) {
          results.push({ note, score });
        }
      }

      // If matches found above threshold, sort and return
      if (results.length > 0) {
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
      }

      // If low similarity but terms match keywords, fallback to keyword search
      return this.keywordFallbackSearch(query, topK);
    } catch (err) {
      console.warn('[RagService] Vector search encountered error, falling back to lexical search:', err);
      return this.keywordFallbackSearch(query, topK);
    }
  }

  /**
   * Fallback search based on token matches in title, tags, and content
   */
  private keywordFallbackSearch(query: string, topK: number): SemanticSearchResult[] {
    const notes = this.notesService.getNotes();
    const cleanQuery = query.trim().toLowerCase();
    const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1);

    const scored: SemanticSearchResult[] = [];
    for (const note of notes) {
      const title = (note.title || '').toLowerCase();
      const content = (note.content || '').toLowerCase();
      const tags = (note.tags || []).map((t) => t.toLowerCase()).join(' ');

      let matchScore = 0;
      if (title.includes(cleanQuery)) matchScore += 0.5;
      if (content.includes(cleanQuery)) matchScore += 0.3;

      for (const term of terms) {
        if (title.includes(term)) matchScore += 0.2;
        if (tags.includes(term)) matchScore += 0.15;
        if (content.includes(term)) matchScore += 0.1;
      }

      if (matchScore > 0) {
        const finalScore = Math.min(0.95, Math.max(0.4, matchScore));
        scored.push({ note, score: finalScore });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Full RAG: Question-Answering synthesized from retrieved relevant note passages
   */
  async askNotesRag(question: string): Promise<RagAnswer> {
    if (!question?.trim()) {
      throw new Error('Question cannot be empty.');
    }

    // Step 1: Retrieval via Semantic Vector Search
    const topMatches = await this.semanticSearch(question, 4, 0.3);

    if (!topMatches.length) {
      return {
        answer: "I couldn't find any relevant notes in your repository related to your question. Try adding or editing notes with more details.",
        sources: [],
      };
    }

    // Step 2: Assemble Context Passages
    const contextPassages = topMatches
      .map(
        (m, idx) =>
          `[Source ${idx + 1}: Note "${m.note.title}" (ID: ${m.note.id}, Relevance: ${Math.round(m.score * 100)}%)]\n${m.note.content}`
      )
      .join('\n\n---\n\n');

    // Step 3: Grounded Synthesis with Gemini 2.0 Flash
    const prompt = `You are the knowledge synthesis engine for the user's personal notes repository.
Answer the user's question accurately, grounded ONLY in the retrieved source notes provided below.

RULES:
1. Cite your sources using [Note: "Title"] format when referencing specific points.
2. If the notes do not contain enough information to fully answer the question, clearly state what is missing rather than inventing facts.
3. Be clear, concise, and structured.

<RETRIEVED_SOURCES>
${contextPassages}
</RETRIEVED_SOURCES>

User Question: "${question}"`;

    const answer = await this.aiService.generateCustomText(prompt, 'RAG Grounded Q&A Synthesis');

    return {
      answer,
      sources: topMatches.map((m) => ({
        id: m.note.id,
        title: m.note.title,
        score: Math.round(m.score * 100),
      })),
    };
  }
}
