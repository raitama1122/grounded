import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';

export const POST: RequestHandler = async ({ request, platform, cookies, url }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
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

    const result = await authService.login(email.trim(), password);
    
    if (!result) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    const { user, session } = result;

    // Set session cookie
    const isProduction = url.protocol === 'https:';
    cookies.set('session', session.id, {
      path: '/',
      httpOnly: true,
      secure: isProduction, // Only secure in production (HTTPS)
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Authentication failed' }, { status: 500 });
  }
};
