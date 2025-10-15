import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';

export const POST: RequestHandler = async ({ request, platform, cookies, url }) => {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return json({ error: 'Email, name, and password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    let authService: AuthService | MemoryAuthService;

    if (platform?.env?.DB) {
      // Production - use D1 database
      const db = new DatabaseService(platform.env.DB);
      authService = new AuthService(db);
    } else {
      // Development fallback - use memory store
      authService = new MemoryAuthService();
    }

    // Check if user already exists
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return json({ error: 'User already exists with this email' }, { status: 409 });
    }

    const { user, session } = await authService.register(email.trim(), name.trim(), password);

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
    console.error('Registration error:', error);
    return json({ error: 'Registration failed' }, { status: 500 });
  }
};
