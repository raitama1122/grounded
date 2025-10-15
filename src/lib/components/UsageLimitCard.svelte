<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.js';
  
  export let showUpgradeModal = false;
  
  interface UsageInfo {
    daily_limit: number;
    current_usage: number;
    remaining: number;
    is_exceeded: boolean;
    plan: 'free' | 'pro';
  }
  
  let usageInfo: UsageInfo | null = null;
  let loading = true;
  let error = '';
  
  async function fetchUsageInfo() {
    if (!$user) return;
    
    try {
      loading = true;
      const response = await fetch('/api/usage');
      
      if (response.ok) {
        const data = await response.json();
        usageInfo = data.usage;
      } else if (response.status === 401) {
        // User not authenticated, clear user store
        user.set(null);
      } else {
        error = 'Failed to load usage information';
      }
    } catch (err) {
      error = 'Failed to load usage information';
      console.error('Error fetching usage info:', err);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    fetchUsageInfo();
  });
  
  // Reactive statement to refetch when user changes
  $: if ($user && typeof window !== 'undefined') {
    fetchUsageInfo();
  }
  
  function handleUpgrade() {
    showUpgradeModal = true;
  }
  
  function getProgressPercentage(): number {
    if (!usageInfo || usageInfo.daily_limit === -1) return 0;
    return Math.min((usageInfo.current_usage / usageInfo.daily_limit) * 100, 100);
  }
  
  function getProgressColor(): string {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  }

  // Export function to refresh usage info from parent component
  export function refresh() {
    fetchUsageInfo();
  }
</script>

{#if $user && usageInfo && !loading}
  <div class="glass-card p-4 border-2 border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-purple-50/60 backdrop-blur-sm">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        {#if usageInfo.plan === 'pro'}
          <div class="flex items-center space-x-2">
            <div class="text-lg">✨</div>
            <div>
              <p class="text-sm font-semibold text-gray-800">PRO Plan</p>
              <p class="text-xs text-gray-600">Unlimited daily questions</p>
            </div>
          </div>
        {:else}
          <div class="flex items-center space-x-3">
            <div class="text-lg">📊</div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm font-semibold text-gray-800">
                  Daily Usage: {usageInfo.current_usage}/{usageInfo.daily_limit}
                </p>
                {#if usageInfo.is_exceeded}
                  <span class="text-xs text-red-600 font-medium">Limit Reached</span>
                {:else}
                  <span class="text-xs text-gray-600">{usageInfo.remaining} left</span>
                {/if}
              </div>
              
              <!-- Progress bar -->
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300 {getProgressColor()}"
                  style="width: {getProgressPercentage()}%"
                ></div>
              </div>
              
              {#if usageInfo.is_exceeded}
                <p class="text-xs text-gray-600 mt-1">
                  Upgrade to PRO for unlimited daily questions
                </p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
      
      {#if usageInfo.plan === 'free'}
        <button
          on:click={handleUpgrade}
          class="ml-4 px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          Upgrade
        </button>
      {/if}
    </div>
  </div>
{:else if loading}
  <div class="glass-card p-4 border-2 border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/60 backdrop-blur-sm">
    <div class="flex items-center space-x-3">
      <div class="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
      <div class="flex-1">
        <div class="h-3 bg-gray-300 rounded animate-pulse mb-2"></div>
        <div class="h-2 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
{:else if error}
  <div class="glass-card p-4 border-2 border-red-200/50 bg-gradient-to-r from-red-50/80 to-red-100/60 backdrop-blur-sm">
    <div class="flex items-center space-x-3">
      <div class="text-red-500">⚠️</div>
      <p class="text-sm text-red-700">{error}</p>
    </div>
  </div>
{/if}
