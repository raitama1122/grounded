import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';
import { UsageTracker, MemoryUsageTracker } from '$lib/usage-tracker.js';

export const GET: RequestHandler = async ({ cookies, platform }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    let authService: AuthService | MemoryAuthService;
    let usageTracker: UsageTracker | MemoryUsageTracker;

    if (platform?.env?.DB) {
      const dbService = new DatabaseService(platform.env.DB);
      authService = new AuthService(dbService);
      usageTracker = new UsageTracker(dbService);
    } else {
      authService = new MemoryAuthService();
      usageTracker = new MemoryUsageTracker();
    }

    // Verify session and get user
    const session = await authService.getSession(sessionToken);
    if (!session) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await authService.getUserById(session.user_id);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Get usage information
    let usageInfo;
    if (platform?.env?.DB) {
      usageInfo = await (usageTracker as UsageTracker).getDailyUsage(user.id);
    } else {
      usageInfo = await (usageTracker as MemoryUsageTracker).getDailyUsage(user.id, user.plan);
    }

    return json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        plan_expires_at: user.plan_expires_at
      },
      usage: usageInfo
    });

  } catch (error) {
    console.error('Error getting usage info:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
