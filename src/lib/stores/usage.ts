import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Track anonymous usage
export const anonymousUsageCount = writable(0);
export const hasUsedAnonymously = writable(false);

// Check anonymous usage from localStorage
export function checkAnonymousUsage(): number {
  if (!browser) return 0;
  
  const stored = localStorage.getItem('grounded_anonymous_usage');
  const count = stored ? parseInt(stored, 10) : 0;
  
  anonymousUsageCount.set(count);
  hasUsedAnonymously.set(count > 0);
  
  return count;
}

// Increment anonymous usage
export function incrementAnonymousUsage(): number {
  if (!browser) return 0;
  
  const current = checkAnonymousUsage();
  const newCount = current + 1;
  
  localStorage.setItem('grounded_anonymous_usage', newCount.toString());
  anonymousUsageCount.set(newCount);
  hasUsedAnonymously.set(true);
  
  return newCount;
}

// Clear anonymous usage (when user registers)
export function clearAnonymousUsage(): void {
  if (!browser) return;
  
  localStorage.removeItem('grounded_anonymous_usage');
  anonymousUsageCount.set(0);
  hasUsedAnonymously.set(false);
}

// Check if user can use anonymously
export function canUseAnonymously(): boolean {
  const count = checkAnonymousUsage();
  return count === 0;
}
