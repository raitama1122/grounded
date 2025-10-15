// Database utilities for D1 operations
import { v4 as uuidv4 } from 'uuid';
import type { GuardianResponse, InsightSummary } from './anthropic.js';

export interface AnalysisRecord {
  id: string;
  query: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  user_ip?: string;
  user_agent?: string;
}

export interface GuardianResponseRecord {
  id: number;
  analysis_id: string;
  guardian_id: string;
  guardian_name: string;
  guardian_avatar: string;
  guardian_personality: string;
  guardian_perspective: string;
  response: string;
  created_at: string;
}

export interface InsightSummaryRecord {
  id: number;
  analysis_id: string;
  main_themes: string; // JSON string
  consensus: string;
  divergent_views: string; // JSON string
  action_items: string; // JSON string
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export class DatabaseService {
  constructor(private db: D1Database) {}

  // Generate a new UUID for analysis
  generateAnalysisId(): string {
    return uuidv4();
  }

  // Create a new analysis record
  async createAnalysis(query: string, userIp?: string, userAgent?: string, userId?: string): Promise<string> {
    const id = this.generateAnalysisId();
    
    await this.db.prepare(`
      INSERT INTO analyses (id, user_id, query, status, user_ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, query, 'processing', userIp, userAgent).run();

    return id;
  }

  // Update analysis status
  async updateAnalysisStatus(id: string, status: AnalysisRecord['status']): Promise<void> {
    await this.db.prepare(`
      UPDATE analyses 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(status, id).run();
  }

  // Save guardian responses
  async saveGuardianResponses(analysisId: string, responses: GuardianResponse[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO guardian_responses 
      (analysis_id, guardian_id, guardian_name, guardian_avatar, guardian_personality, guardian_perspective, response)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const response of responses) {
      await stmt.bind(
        analysisId,
        response.guardian.id,
        response.guardian.name,
        response.guardian.avatar,
        response.guardian.personality,
        response.guardian.perspective,
        response.response
      ).run();
    }
  }

  // Save insight summary
  async saveInsightSummary(analysisId: string, summary: InsightSummary): Promise<void> {
    await this.db.prepare(`
      INSERT INTO insight_summaries 
      (analysis_id, main_themes, consensus, divergent_views, action_items, overall_sentiment, sentiment_details, guardian_scores)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      analysisId,
      JSON.stringify(summary.mainThemes),
      summary.consensus,
      JSON.stringify(summary.divergentViews),
      JSON.stringify(summary.actionItems),
      summary.overallSentiment,
      JSON.stringify(summary.sentimentDetails),
      summary.guardianScores ? JSON.stringify(summary.guardianScores) : null
    ).run();
  }

  // Get analysis by ID
  async getAnalysis(id: string): Promise<AnalysisRecord | null> {
    const result = await this.db.prepare(`
      SELECT * FROM analyses WHERE id = ?
    `).bind(id).first();

    return result as AnalysisRecord | null;
  }

  // Get guardian responses for an analysis
  async getGuardianResponses(analysisId: string): Promise<GuardianResponseRecord[]> {
    const results = await this.db.prepare(`
      SELECT * FROM guardian_responses 
      WHERE analysis_id = ? 
      ORDER BY created_at ASC
    `).bind(analysisId).all();

    return results.results as GuardianResponseRecord[];
  }

  // Get insight summary for an analysis
  async getInsightSummary(analysisId: string): Promise<InsightSummaryRecord | null> {
    const result = await this.db.prepare(`
      SELECT * FROM insight_summaries WHERE analysis_id = ?
    `).bind(analysisId).first();

    return result as InsightSummaryRecord | null;
  }

  // Get complete analysis data
  async getCompleteAnalysis(id: string) {
    const [analysis, responses, summary] = await Promise.all([
      this.getAnalysis(id),
      this.getGuardianResponses(id),
      this.getInsightSummary(id)
    ]);

    if (!analysis) {
      return null;
    }

    return {
      analysis,
      responses: responses.map(r => ({
        guardian: {
          id: r.guardian_id,
          name: r.guardian_name,
          avatar: r.guardian_avatar,
          personality: r.guardian_personality,
          perspective: r.guardian_perspective,
          color: '', // Will be filled from guardians config
          systemPrompt: '' // Will be filled from guardians config
        },
        response: r.response,
        timestamp: new Date(r.created_at)
      })),
      summary: summary ? {
        mainThemes: JSON.parse(summary.main_themes),
        consensus: summary.consensus,
        divergentViews: JSON.parse(summary.divergent_views),
        actionItems: JSON.parse(summary.action_items),
        overallSentiment: summary.overall_sentiment
      } : null
    };
  }

  // Log analytics event
  async logAnalyticsEvent(eventType: string, analysisId?: string, metadata?: any): Promise<void> {
    await this.db.prepare(`
      INSERT INTO analytics (event_type, analysis_id, metadata)
      VALUES (?, ?, ?)
    `).bind(eventType, analysisId || null, metadata ? JSON.stringify(metadata) : null).run();
  }

  // Get recent analyses (for admin/stats)
  async getRecentAnalyses(limit: number = 10): Promise<AnalysisRecord[]> {
    const results = await this.db.prepare(`
      SELECT * FROM analyses 
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(limit).all();

    return results.results as AnalysisRecord[];
  }
}
