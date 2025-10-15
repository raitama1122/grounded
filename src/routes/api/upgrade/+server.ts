import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database.js';
import { AuthService, MemoryAuthService } from '$lib/auth.js';
import { UsageTracker, MemoryUsageTracker } from '$lib/usage-tracker.js';

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payment_method } = await request.json();
    
    // In a real implementation, you would:
    // 1. Validate payment method with Stripe/PayPal
    // 2. Process the $5 payment
    // 3. Handle payment success/failure
    
    // For now, we'll simulate a successful payment
    if (!payment_method || payment_method !== 'demo_success') {
      return json({ error: 'Invalid payment method' }, { status: 400 });
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

    // Upgrade user to PRO
    await usageTracker.upgradeToPro(user.id);

    // Get updated usage information
    let usageInfo;
    if (platform?.env?.DB) {
      usageInfo = await (usageTracker as UsageTracker).getDailyUsage(user.id);
    } else {
      usageInfo = await (usageTracker as MemoryUsageTracker).getDailyUsage(user.id, 'pro');
    }

    return json({
      success: true,
      message: 'Successfully upgraded to PRO plan',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: 'pro'
      },
      usage: usageInfo
    });

  } catch (error) {
    console.error('Error upgrading to PRO:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
