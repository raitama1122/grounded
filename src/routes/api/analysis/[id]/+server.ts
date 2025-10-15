import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database.js';
import { MemoryStore } from '$lib/memory-store.js';
import { guardians } from '$lib/guardians.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    let analysisData = null;

    // Try D1 database first
    if (platform?.env?.DB) {
      const db = new DatabaseService(platform.env.DB);
      analysisData = await db.getCompleteAnalysis(id);
      
      if (analysisData) {
        // Log analytics event
        await db.logAnalyticsEvent('analysis_viewed', id, {
          timestamp: new Date().toISOString()
        });
      }
    }

    // Fallback to memory store if not found in D1 or D1 not available
    if (!analysisData) {
      const memoryData = MemoryStore.getAnalysis(id);
      if (memoryData) {
        analysisData = {
          analysis: {
            id: memoryData.id,
            query: memoryData.query,
            created_at: memoryData.created_at,
            status: memoryData.status,
            user_id: memoryData.user_id || null
          },
          responses: memoryData.responses,
          summary: memoryData.summary
        };
      }
    }
    
    if (!analysisData) {
      return json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Enrich guardian data with colors and system prompts
    const enrichedResponses = analysisData.responses.map(response => {
      const guardianConfig = guardians.find(g => g.id === response.guardian.id);
      return {
        ...response,
        guardian: {
          ...response.guardian,
          color: guardianConfig?.color || 'bg-gradient-to-br from-gray-400 to-gray-600',
          systemPrompt: guardianConfig?.systemPrompt || ''
        }
      };
    });

    return json({
      id: analysisData.analysis.id,
      query: analysisData.analysis.query,
      responses: enrichedResponses,
      summary: analysisData.summary,
      created_at: analysisData.analysis.created_at,
      status: analysisData.analysis.status,
      user_id: analysisData.analysis.user_id || null
    });
  } catch (error) {
    console.error('Error retrieving analysis:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
