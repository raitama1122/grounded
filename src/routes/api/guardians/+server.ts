import { json } from '@sveltejs/kit';
import { getAllGuardianResponses, generateInsightSummary } from '$lib/anthropic.js';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';
import { MemoryStore } from '$lib/memory-store.js';
import { UsageTracker, MemoryUsageTracker } from '$lib/usage-tracker.js';
import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return json({ error: 'Query is required' }, { status: 400 });
    }

    // Get client info
    const userIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check for authenticated user
    let userId: string | null = null;
    let authService: AuthService | MemoryAuthService | null = null;
    const sessionToken = cookies.get('session');
    
    if (sessionToken) {
      if (platform?.env?.DB) {
        const dbService = new DatabaseService(platform.env.DB);
        authService = new AuthService(dbService);
      } else {
        authService = new MemoryAuthService();
      }

      try {
        const session = await authService.getSession(sessionToken);
        if (session) {
          const user = await authService.getUserById(session.user_id);
          if (user) {
            userId = user.id;
            
            // Check usage limits for authenticated users
            try {
              if (platform?.env?.DB) {
                const usageTracker = new UsageTracker(new DatabaseService(platform.env.DB));
                const usageInfo = await usageTracker.getDailyUsage(userId);
                
                if (usageInfo.is_exceeded) {
                  return json({ 
                    error: 'Daily limit exceeded',
                    usage: usageInfo,
                    upgrade_required: true
                  }, { status: 429 });
                }
              } else {
                // Development mode
                const usageTracker = new MemoryUsageTracker();
                const usageInfo = await usageTracker.getDailyUsage(userId, user.plan);
                
                if (usageInfo.is_exceeded) {
                  return json({ 
                    error: 'Daily limit exceeded',
                    usage: usageInfo,
                    upgrade_required: true
                  }, { status: 429 });
                }
              }
            } catch (usageError) {
              console.error('Error checking usage limits:', usageError);
              // Continue with request if usage check fails
            }
          }
        }
      } catch (error) {
        console.log('Session check failed:', error);
        // Continue without user ID - allow anonymous usage
      }
    }

    // Initialize database service (if D1 is available)
    let db: DatabaseService | null = null;
    let analysisId: string;

    if (platform?.env?.DB) {
      db = new DatabaseService(platform.env.DB);
      analysisId = await db.createAnalysis(query.trim(), userIp, userAgent, userId || undefined);
      
      // Log analytics event
      await db.logAnalyticsEvent('query_submitted', analysisId, {
        query_length: query.trim().length,
        guardians_count: 9
      });
    } else {
      // Fallback: generate UUID for development mode
      analysisId = uuidv4();
    }

    try {
      // Get responses from all guardians in parallel
      const responses = await getAllGuardianResponses(query.trim());
      
      // Generate insight summary
      const summary = await generateInsightSummary(responses, query.trim());

      // Save to database if available, otherwise use memory store
      if (db) {
        await Promise.all([
          db.saveGuardianResponses(analysisId, responses),
          db.saveInsightSummary(analysisId, summary),
          db.updateAnalysisStatus(analysisId, 'completed')
        ]);
      } else {
        // Save to memory store for development mode
        MemoryStore.saveAnalysis(analysisId, query.trim(), responses, summary, userId || undefined);
      }

      // Increment usage for authenticated users
      if (userId && authService) {
        try {
          if (platform?.env?.DB) {
            const usageTracker = new UsageTracker(new DatabaseService(platform.env.DB));
            await usageTracker.incrementUsage(userId);
          } else {
            // Development mode
            const usageTracker = new MemoryUsageTracker();
            const user = await authService.getUserById(userId);
            await usageTracker.incrementUsage(userId, user?.plan || 'free');
          }
        } catch (usageError) {
          console.error('Error incrementing usage:', usageError);
          // Don't fail the request if usage tracking fails
        }
      }

      return json({
        id: analysisId,
        query: query.trim(),
        responses,
        summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Update status to failed if database is available
      if (db && analysisId) {
        await db.updateAnalysisStatus(analysisId, 'failed');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in guardians API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
