import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';

export const POST: RequestHandler = async ({ platform, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    
    if (sessionToken) {
      let authService: AuthService | MemoryAuthService;

      // Use D1 database if available, otherwise fall back to memory store
      if (platform?.env?.DB) {
        const dbService = new DatabaseService(platform.env.DB);
        authService = new AuthService(dbService);
      } else {
        // Development fallback - use memory store
        authService = new MemoryAuthService();
      }

      await authService.deleteSession(sessionToken);
    }

    // Clear session cookie
    cookies.delete('session', { path: '/' });

    return json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return json({ error: 'Logout failed' }, { status: 500 });
  }
};
