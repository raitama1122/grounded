// Simple in-memory store for development mode
// This is used when D1 database is not available

import type { GuardianResponse, InsightSummary } from './anthropic.js';

interface StoredAnalysis {
  id: string;
  user_id?: string;  // Add user_id support
  query: string;
  responses: GuardianResponse[];
  summary: InsightSummary | null;
  created_at: string;
  status: 'completed' | 'failed';
}

// In-memory storage (will be lost on server restart)
const analysisStore = new Map<string, StoredAnalysis>();

export class MemoryStore {
  static saveAnalysis(
    id: string,
    query: string,
    responses: GuardianResponse[],
    summary: InsightSummary | null,
    userId?: string
  ): void {
    analysisStore.set(id, {
      id,
      user_id: userId,
      query,
      responses,
      summary,
      created_at: new Date().toISOString(),
      status: 'completed'
    });
  }

  // Instance methods for non-static usage
  saveAnalysis(
    id: string,
    query: string,
    responses: GuardianResponse[],
    summary: InsightSummary | null,
    userId?: string
  ): void {
    MemoryStore.saveAnalysis(id, query, responses, summary, userId);
  }

  getAnalysis(id: string): StoredAnalysis | null {
    return MemoryStore.getAnalysis(id);
  }

  getAllAnalyses(): StoredAnalysis[] {
    return MemoryStore.getAllAnalyses();
  }

  static getAnalysis(id: string): StoredAnalysis | null {
    return analysisStore.get(id) || null;
  }

  static hasAnalysis(id: string): boolean {
    return analysisStore.has(id);
  }

  static getAllAnalyses(): StoredAnalysis[] {
    return Array.from(analysisStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  static claimAnalysis(id: string, userId: string): boolean {
    const analysis = analysisStore.get(id);
    if (!analysis || analysis.user_id) {
      return false; // Analysis doesn't exist or is already claimed
    }

    analysis.user_id = userId;
    analysis.updated_at = new Date().toISOString();
    analysisStore.set(id, analysis);
    return true;
  }

  static clearAll(): void {
    analysisStore.clear();
  }

  static getCount(): number {
    return analysisStore.size;
  }
}
