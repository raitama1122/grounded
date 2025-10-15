import { v4 as uuidv4 } from 'uuid';
import type { DatabaseService } from './database.js';

export interface DailyUsage {
  id: string;
  user_id: string;
  usage_date: string; // YYYY-MM-DD format
  query_count: number;
  created_at: string;
  updated_at: string;
}

export interface UsageLimit {
  daily_limit: number;
  current_usage: number;
  remaining: number;
  is_exceeded: boolean;
  plan: 'free' | 'pro';
}

export class UsageTracker {
  constructor(private db: DatabaseService) {}

  // Get today's date in YYYY-MM-DD format
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Check user's current daily usage
  async getDailyUsage(userId: string): Promise<UsageLimit> {
    const today = this.getTodayDate();
    
    // Get user's plan
    const userResult = await this.db.db.prepare(`
      SELECT plan, plan_expires_at FROM users WHERE id = ?
    `).bind(userId).first();

    if (!userResult) {
      throw new Error('User not found');
    }

    const userPlan = userResult.plan as 'free' | 'pro';
    const planExpiresAt = userResult.plan_expires_at as string | null;

    // Check if PRO plan is expired
    const isPlanActive = userPlan === 'free' || 
      (planExpiresAt && new Date(planExpiresAt) > new Date());
    
    const effectivePlan = isPlanActive ? userPlan : 'free';
    const dailyLimit = effectivePlan === 'pro' ? -1 : 10; // -1 means unlimited

    // Get today's usage
    const usageResult = await this.db.db.prepare(`
      SELECT query_count FROM user_daily_usage 
      WHERE user_id = ? AND usage_date = ?
    `).bind(userId, today).first();

    const currentUsage = usageResult?.query_count || 0;
    const remaining = dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - currentUsage);
    const isExceeded = dailyLimit !== -1 && currentUsage >= dailyLimit;

    return {
      daily_limit: dailyLimit,
      current_usage: currentUsage,
      remaining,
      is_exceeded: isExceeded,
      plan: effectivePlan
    };
  }

  // Increment user's daily usage
  async incrementUsage(userId: string): Promise<UsageLimit> {
    const today = this.getTodayDate();
    const now = new Date().toISOString();

    // Try to update existing record
    const updateResult = await this.db.db.prepare(`
      UPDATE user_daily_usage 
      SET query_count = query_count + 1, updated_at = ?
      WHERE user_id = ? AND usage_date = ?
    `).bind(now, userId, today).run();

    // If no record exists, create one
    if (updateResult.changes === 0) {
      const usageId = uuidv4();
      await this.db.db.prepare(`
        INSERT INTO user_daily_usage (id, user_id, usage_date, query_count, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `).bind(usageId, userId, today, now, now).run();
    }

    // Return updated usage info
    return this.getDailyUsage(userId);
  }

  // Upgrade user to PRO plan
  async upgradeToPro(userId: string): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    await this.db.db.prepare(`
      UPDATE users 
      SET plan = 'pro', plan_expires_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(expiresAt.toISOString(), now, userId).run();
  }

  // Get usage history for a user
  async getUsageHistory(userId: string, days: number = 30): Promise<DailyUsage[]> {
    const result = await this.db.db.prepare(`
      SELECT * FROM user_daily_usage 
      WHERE user_id = ? 
      ORDER BY usage_date DESC 
      LIMIT ?
    `).bind(userId, days).all();

    return result.results as DailyUsage[];
  }
}

// In-memory usage tracker for development
const memoryUsage = new Map<string, Map<string, number>>(); // userId -> date -> count

export class MemoryUsageTracker {
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  async getDailyUsage(userId: string, userPlan: 'free' | 'pro' = 'free'): Promise<UsageLimit> {
    const today = this.getTodayDate();
    const userUsage = memoryUsage.get(userId) || new Map();
    const currentUsage = userUsage.get(today) || 0;
    
    const dailyLimit = userPlan === 'pro' ? -1 : 10;
    const remaining = dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - currentUsage);
    const isExceeded = dailyLimit !== -1 && currentUsage >= dailyLimit;

    return {
      daily_limit: dailyLimit,
      current_usage: currentUsage,
      remaining,
      is_exceeded: isExceeded,
      plan: userPlan
    };
  }

  async incrementUsage(userId: string, userPlan: 'free' | 'pro' = 'free'): Promise<UsageLimit> {
    const today = this.getTodayDate();
    
    if (!memoryUsage.has(userId)) {
      memoryUsage.set(userId, new Map());
    }
    
    const userUsage = memoryUsage.get(userId)!;
    const currentCount = userUsage.get(today) || 0;
    const newCount = currentCount + 1;
    userUsage.set(today, newCount);

    return this.getDailyUsage(userId, userPlan);
  }

  async upgradeToPro(userId: string): Promise<void> {
    // In memory implementation - would need to update user plan in memory store
    console.log(`User ${userId} upgraded to PRO (memory mode)`);
  }
}
