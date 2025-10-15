<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user, isLoading } from '$lib/stores/user.js';
  import UsageLimitCard from '$lib/components/UsageLimitCard.svelte';
  import UpgradeModal from '$lib/components/UpgradeModal.svelte';

  interface Analysis {
    id: string;
    query: string;
    created_at: string;
    guardian_count: number;
    has_summary: number;
  }

  let analyses: Analysis[] = [];
  let loading = true;
  let error = '';
  let showUpgradeModal = false;
  let currentPage = 1;
  let totalPages = 1;

  async function loadAnalyses(page = 1) {
    try {
      loading = true;
      const response = await fetch(`/api/user/analyses?page=${page}&limit=12`);
      
      if (response.status === 401) {
        goto('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load analyses');
      }

      const data = await response.json();
      analyses = data.analyses;
      currentPage = data.pagination.page;
      totalPages = data.pagination.totalPages;
    } catch (err) {
      error = 'Failed to load your analyses';
      console.error('Load analyses error:', err);
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleUpgradeSuccess(event: CustomEvent) {
    showUpgradeModal = false;
    // Refresh the page to show updated plan
    loadAnalyses(currentPage);
  }

  function handleUpgradeClose() {
    showUpgradeModal = false;
  }

  function getAnalysisPreview(query: string): string {
    return query.length > 80 ? query.substring(0, 80) + '...' : query;
  }

  function goToAnalysis(analysisId: string) {
    goto(`/analysis/${analysisId}`);
  }


  onMount(() => {
    // Wait for user authentication check to complete
    const unsubscribe = isLoading.subscribe(loading => {
      if (!loading) {
        const currentUser = $user;
        if (currentUser) {
          loadAnalyses();
        } else {
          // Redirect to home if not authenticated
          goto('/');
        }
        unsubscribe();
      }
    });
  });
</script>

<svelte:head>
  <title>My Analyses - Grounded</title>
  <meta name="description" content="View and manage your analysis history on Grounded" />
</svelte:head>

<main class="min-h-screen px-4 py-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="text-center mb-12">
    <div class="floating-element mb-8">
      <h1 class="text-4xl md:text-6xl font-black gradient-text mb-4 tracking-tight">
        My Analyses
      </h1>
      {#if $user}
        <p class="text-lg text-gray-600 font-medium">
          Welcome back, {$user.name}! Here's your analysis history.
        </p>
      {/if}
    </div>
  </div>

  <!-- Usage Limit Card -->
  {#if $user}
    <div class="mb-8">
      <UsageLimitCard bind:showUpgradeModal />
    </div>
  {/if}

  {#if loading}
    <!-- Loading State -->
    <div class="glass-card p-12 text-center">
      <div class="flex flex-col items-center justify-center">
        <div class="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 font-medium">Loading your analyses...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="glass-card p-12 text-center">
      <div class="text-red-500 mb-4">
        <span class="text-4xl">⚠️</span>
      </div>
      <h2 class="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
      <p class="text-gray-600 mb-6">{error}</p>
      <button 
        on:click={() => loadAnalyses()} 
        class="glass-button bg-gradient-to-r from-orange-500 to-red-500"
      >
        Try Again
      </button>
    </div>
  {:else if analyses.length === 0}
    <!-- Empty State -->
    <div class="glass-card p-12 text-center">
      <div class="text-gray-400 mb-6">
        <span class="text-6xl">🤔</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-4">No analyses yet</h2>
      <p class="text-gray-600 mb-8">
        You haven't created any analyses yet. Start by asking the guardians for their perspectives!
      </p>
      <a href="/" class="glass-button bg-gradient-to-r from-orange-500 to-red-500">
        ✨ Create Your First Analysis
      </a>
    </div>
  {:else}
    <!-- Analyses Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {#each analyses as analysis}
        <div 
          class="glass-card p-6 cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl"
          on:click={() => goToAnalysis(analysis.id)}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && goToAnalysis(analysis.id)}
        >
          <!-- Analysis Preview -->
          <div class="mb-4">
            <h3 class="font-bold text-gray-800 mb-2 leading-tight">
              "{getAnalysisPreview(analysis.query)}"
            </h3>
            <p class="text-sm text-gray-500">
              {formatDate(analysis.created_at)}
            </p>
          </div>

          <!-- Stats -->
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-1">
                <span class="text-blue-500">👥</span>
                <span class="text-gray-600">{analysis.guardian_count} guardians</span>
              </div>
              {#if analysis.has_summary}
                <div class="flex items-center space-x-1">
                  <span class="text-green-500">✅</span>
                  <span class="text-gray-600">Summary</span>
                </div>
              {/if}
            </div>
            <div class="text-orange-500 font-medium">
              View →
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex justify-center items-center space-x-4">
        <button
          on:click={() => loadAnalyses(currentPage - 1)}
          disabled={currentPage === 1}
          class="glass-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        <span class="text-gray-600 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          on:click={() => loadAnalyses(currentPage + 1)}
          disabled={currentPage === totalPages}
          class="glass-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    {/if}
  {/if}

  <!-- Quick Actions -->
  <div class="fixed bottom-8 right-8">
    <a 
      href="/"
      class="glass-button bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      title="Create New Analysis"
    >
      <span class="text-2xl">✨</span>
    </a>
  </div>
</main>


<!-- Floating Background Elements -->
<div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
  <div class="floating-element absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-pink-200/30 rounded-full blur-xl"></div>
  <div class="floating-element absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-xl" style="animation-delay: -2s;"></div>
  <div class="floating-element absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-green-200/30 to-yellow-200/30 rounded-full blur-xl" style="animation-delay: -4s;"></div>
</div>

<!-- Upgrade Modal -->
<UpgradeModal 
  isOpen={showUpgradeModal}
  on:close={handleUpgradeClose}
  on:success={handleUpgradeSuccess}
/>
