import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database.js';
import { MemoryStore } from '$lib/memory-store.js';
import { guardians } from '$lib/guardians.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, cookies }) => {
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

    // Check authorization - user can only view their own analyses or anonymous analyses
    const sessionToken = cookies.get('session');
    let currentUserId: string | null = null;
    
    if (sessionToken) {
      try {
        let authService: AuthService | MemoryAuthService;
        
        if (platform?.env?.DB) {
          const dbService = new DatabaseService(platform.env.DB);
          authService = new AuthService(dbService);
        } else {
          authService = new MemoryAuthService();
        }
        
        const session = await authService.getSession(sessionToken);
        if (session) {
          const user = await authService.getUserById(session.user_id);
          if (user) {
            currentUserId = user.id;
          }
        }
      } catch (authError) {
        // Continue without authentication if auth fails
        console.error('Auth error in analysis endpoint:', authError);
      }
    }

    // Authorization check: strict privacy model
    const analysisUserId = analysisData.analysis.user_id;
    
    if (analysisUserId) {
      // Analysis has an owner - only the owner can access it
      if (analysisUserId !== currentUserId) {
        return json({ error: 'Analysis not found' }, { status: 404 });
      }
    } else {
      // Anonymous analysis - only accessible to anonymous users in the same session
      // Since we don't store session IDs with analyses, we have limited session tracking
      // For now, we'll allow anonymous users to access anonymous analyses
      // but authenticated users cannot access anonymous analyses (prevents cross-user access)
      
      if (currentUserId) {
        // Authenticated users cannot access anonymous analyses
        return json({ error: 'Analysis not found' }, { status: 404 });
      }
      
      // Anonymous user accessing anonymous analysis - allowed
      // Note: This doesn't enforce per-session privacy due to lack of session_id storage
      // Anonymous analyses become "orphaned" when sessions expire and are effectively private
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
