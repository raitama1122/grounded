import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';
import { MemoryStore } from '$lib/memory-store.js';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  try {
    const { analysisId } = await request.json();

    if (!analysisId) {
      return json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    // Get session from cookie
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    let authService: AuthService | MemoryAuthService;
    let db: DatabaseService | null = null;

    if (platform?.env?.DB) {
      // Production - use D1 database
      db = new DatabaseService(platform.env.DB);
      authService = new AuthService(db);
    } else {
      // Development fallback - use memory store
      authService = new MemoryAuthService();
    }

    // Verify session and get user
    const session = await authService.getSession(sessionToken);
    if (!session) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await authService.getUserById(session.user_id);
    if (!user) {
      return json({ error: 'User not found' }, { status: 401 });
    }

    if (db) {
      // Production: Update analysis in D1 database
      const result = await db.db.prepare(`
        UPDATE analyses 
        SET user_id = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id IS NULL
      `).bind(user.id, analysisId).run();

      if (result.changes === 0) {
        return json({ error: 'Analysis not found or already claimed' }, { status: 404 });
      }
    } else {
      // Development: Update analysis in memory store
      const success = MemoryStore.claimAnalysis(analysisId, user.id);
      if (!success) {
        return json({ error: 'Analysis not found or already claimed' }, { status: 404 });
      }
    }

    return json({ success: true });

  } catch (error) {
    console.error('Claim analysis error:', error);
    return json({ error: 'Failed to claim analysis' }, { status: 500 });
  }
};
