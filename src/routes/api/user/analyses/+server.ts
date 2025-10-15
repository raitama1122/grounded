import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';
import { MemoryStore } from '$lib/memory-store.js';

export const GET: RequestHandler = async ({ platform, cookies, url }) => {
  try {
    const sessionToken = cookies.get('session');
    
    if (!sessionToken) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    let authService: AuthService | MemoryAuthService;
    let dbService: DatabaseService | null = null;
    let memoryStore: MemoryStore | null = null;

    // Use D1 database if available, otherwise fall back to memory store
    if (platform?.env?.DB) {
      dbService = new DatabaseService(platform.env.DB);
      authService = new AuthService(dbService);
    } else {
      // Development fallback - use memory store
      authService = new MemoryAuthService();
      memoryStore = new MemoryStore();
    }

    const session = await authService.getSession(sessionToken);
    
    if (!session) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await authService.getUserById(session.user_id);
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Get pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let analyses = [];
    let total = 0;

    if (dbService) {
      // Get user's analyses from D1 database
      const analysesResult = await dbService.db.prepare(`
        SELECT 
          a.*,
          COUNT(gr.id) as guardian_count,
          CASE WHEN is.id IS NOT NULL THEN 1 ELSE 0 END as has_summary
        FROM analyses a
        LEFT JOIN guardian_responses gr ON a.id = gr.analysis_id
        LEFT JOIN insight_summaries is ON a.id = is.analysis_id
        WHERE a.user_id = ?
        GROUP BY a.id
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(user.id, limit, offset).all();

      const countResult = await dbService.db.prepare(`
        SELECT COUNT(*) as total FROM analyses WHERE user_id = ?
      `).bind(user.id).first();

      analyses = analysesResult.results || [];
      total = (countResult as any)?.total || 0;
    } else if (memoryStore) {
      // Development fallback - get from memory store
      // Note: This is a simplified version for development
      const allAnalyses = memoryStore.getAllAnalyses();
      const userAnalyses = allAnalyses.filter(a => a.user_id === user.id);
      
      total = userAnalyses.length;
      analyses = userAnalyses
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit)
        .map(a => ({
          ...a,
          guardian_count: a.responses?.length || 0,
          has_summary: a.summary ? 1 : 0
        }));
    }

    return json({
      analyses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user analyses error:', error);
    return json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
};
