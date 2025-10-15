import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';

export const GET: RequestHandler = async ({ platform, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    
    if (!sessionToken) {
      return json({ user: null });
    }

    let authService: AuthService | MemoryAuthService;

    // Use D1 database if available, otherwise fall back to memory store
    if (platform?.env?.DB) {
      const dbService = new DatabaseService(platform.env.DB);
      authService = new AuthService(dbService);
    } else {
      // Development fallback - use memory store
      authService = new MemoryAuthService();
    }

    const session = await authService.getSession(sessionToken);
    
    if (!session) {
      // Invalid or expired session
      cookies.delete('session', { path: '/' });
      return json({ user: null });
    }

    const user = await authService.getUserById(session.user_id);
    
    if (!user) {
      // User not found
      cookies.delete('session', { path: '/' });
      return json({ user: null });
    }

    return json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return json({ user: null });
  }
};
