<script lang="ts">
	import { onMount } from 'svelte';
	import { guardians } from '$lib/guardians.js';
	import type { GuardianResponse, InsightSummary } from '$lib/anthropic.js';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user.js';
	import { checkAnonymousUsage, incrementAnonymousUsage, canUseAnonymously } from '$lib/stores/usage.js';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import UsageLimitCard from '$lib/components/UsageLimitCard.svelte';
	import UpgradeModal from '$lib/components/UpgradeModal.svelte';

	let query = '';
	let isLoading = false;
	let responses: GuardianResponse[] = [];
	let summary: InsightSummary | null = null;
	let error = '';
	let showAuthModal = false;
	let showUpgradeModal = false;
	let canUseAnonymous = true;
	let authContext: 'general' | 'my-ideas' | 'new-analysis' | 'continue-analysis' = 'general';
	let usageLimitCard: any = null;

	async function submitQuery() {
		// If user needs to login (no matter if query is empty or not)
		if (!$user && !canUseAnonymous) {
			authContext = 'continue-analysis';
			showAuthModal = true;
			return;
		}

		// For normal query submission, require query text
		if (!query.trim()) return;

		isLoading = true;
		error = '';
		responses = [];
		summary = null;

		try {
			const response = await fetch('/api/guardians', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ query: query.trim() })
			});

			if (response.status === 429) {
				// Rate limit exceeded
				const errorData = await response.json();
				if (errorData.upgrade_required) {
					showUpgradeModal = true;
					return;
				}
				throw new Error('Daily limit exceeded');
			}

			if (!response.ok) {
				throw new Error('Failed to get responses');
			}

			const data = await response.json();
			
			// If user is not authenticated, increment anonymous usage and store analysis ID
			if (!$user) {
				incrementAnonymousUsage();
				// Store the analysis ID for potential claiming later
				if (data.id && typeof localStorage !== 'undefined') {
					localStorage.setItem('grounded_pending_analysis', data.id);
				}
			}
			
			// Refresh usage info for authenticated users (before redirect)
			if ($user && usageLimitCard && typeof usageLimitCard.refresh === 'function') {
				try {
					usageLimitCard.refresh();
				} catch (err) {
					console.warn('Failed to refresh usage card:', err);
				}
			}

			// If we have an analysis ID, redirect to the analysis page
			if (data.id) {
				// Small delay to ensure usage tracking completes on server
				setTimeout(() => {
					goto(`/analysis/${data.id}`);
				}, 100);
				return;
			}
			
			// Fallback: show results inline (for when database is not available)
			responses = data.responses;
			summary = data.summary;
		} catch (err) {
			error = 'Something went wrong. Please try again.';
			console.error('Error:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submitQuery();
		}
	}

	async function handleAuthSuccess() {
		showAuthModal = false;
		
		// Check if there's a pending analysis to claim
		if (typeof localStorage !== 'undefined') {
			const pendingAnalysisId = localStorage.getItem('grounded_pending_analysis');
			if (pendingAnalysisId) {
				try {
					const response = await fetch('/api/analysis/claim', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ analysisId: pendingAnalysisId }),
					});
					
					if (response.ok) {
						// Successfully claimed the analysis, remove from localStorage
						localStorage.removeItem('grounded_pending_analysis');
						// Redirect to the claimed analysis
						goto(`/analysis/${pendingAnalysisId}`);
						return;
					}
				} catch (err) {
					console.error('Failed to claim analysis:', err);
				}
			}
		}
		
		// After successful auth, user can proceed with their query
		submitQuery();
	}

	function handleAuthClose() {
		showAuthModal = false;
	}

	function handleUpgradeSuccess(event: CustomEvent) {
		showUpgradeModal = false;
		// Refresh user data to show updated plan
		if ($user) {
			// The user store will be updated automatically when they make their next request
		}
	}

	function handleUpgradeClose() {
		showUpgradeModal = false;
	}

	onMount(() => {
		// Check if user can use the platform anonymously
		canUseAnonymous = canUseAnonymously();
	});
</script>

<svelte:head>
	<title>Grounded - Stay Grounded About Your Ideas</title>
</svelte:head>

<main class="min-h-screen px-4 py-8 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="text-center mb-16">
		<div class="floating-element mb-8">
			<h1 class="text-6xl md:text-8xl font-black gradient-text mb-6 tracking-tight">
				Grounded
			</h1>
			<div class="max-w-2xl mx-auto">
				<p class="text-2xl md:text-3xl text-gray-700 font-light leading-relaxed mb-4">
					Get diverse perspectives on your ideas
				</p>
				<p class="text-lg md:text-xl text-gray-600 font-medium">
					from <span class="gradient-text font-bold">9 AI guardians</span>
				</p>
			</div>
		</div>
		
		<!-- Static accent elements -->
		<div class="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full opacity-30"></div>
		<div class="absolute top-32 right-16 w-3 h-3 bg-orange-300 rounded-full opacity-25"></div>
		<div class="absolute top-16 right-1/3 w-2 h-2 bg-orange-500 rounded-full opacity-35"></div>
	</div>

	<!-- Usage Limit Card for Authenticated Users -->
	{#if $user}
		<div class="mb-6 mx-auto max-w-5xl px-4">
			<UsageLimitCard bind:showUpgradeModal bind:this={usageLimitCard} />
		</div>
	{/if}

	<!-- Query Input -->
	<div class="glass-card shimmer p-8 md:p-10 mb-12 mx-auto max-w-5xl">
		<div class="space-y-6">
			<div class="text-center mb-6">
				<h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
					What's on your mind?
				</h2>
				<p class="text-lg text-gray-600 font-medium">
					Ask for opinions, comparisons, or feedback on your ideas
				</p>
			</div>
			
			<textarea
				id="query"
				bind:value={query}
				on:keypress={handleKeyPress}
				placeholder="e.g., Should I start a food truck business? What do you think about remote work vs office work? I'm considering switching careers to tech..."
				class="w-full h-40 p-6 rounded-3xl border-2 border-white/30 bg-white/60 backdrop-blur-sm resize-none focus:outline-none focus:ring-4 focus:ring-orange-500/30 focus:border-orange-400 transition-all duration-500 text-lg placeholder-gray-500 shadow-inner"
				disabled={isLoading}
			></textarea>
			
			<!-- Subtle login message for anonymous users -->
			{#if !$user && !canUseAnonymous}
				<div class="glass-card p-4 border-2 border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/60 backdrop-blur-sm">
					<div class="flex items-center space-x-3">
						<div class="text-xl">💡</div>
						<div>
							<p class="text-gray-700 text-sm">Login to continue using, save your ideas and more... it's free.</p>
						</div>
					</div>
				</div>
			{/if}

			<div class="flex flex-col sm:flex-row justify-between items-center gap-4">
				<p class="text-sm text-gray-600 font-medium">
					💡 Press <kbd class="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> to submit, <kbd class="px-2 py-1 bg-gray-200 rounded text-xs">Shift+Enter</kbd> for new line
				</p>
				<button
					on:click={submitQuery}
					disabled={isLoading || ($user || canUseAnonymous ? !query.trim() : false)}
					class="glass-button bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
				>
					{isLoading ? '🔮 Consulting Guardians...' : (!$user && !canUseAnonymous ? 'Login' : '✨ Get Perspectives')}
				</button>
			</div>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="glass-card p-6 mb-8 border-red-200 bg-red-50/50">
			<p class="text-red-600 text-center">{error}</p>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="glass-card p-12 mb-12 text-center">
			<div class="flex flex-col items-center justify-center">
				<div class="relative mb-8">
					<div class="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
					<div class="absolute inset-3 w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse"></div>
				</div>
				
				<div class="mb-8">
					<h3 class="text-2xl font-bold text-gray-800 mb-3 gradient-text">Consulting the Guardians</h3>
					<p class="text-lg text-gray-700 font-medium">Getting diverse perspectives on your idea...</p>
				</div>
				
				<div class="grid grid-cols-9 gap-3 max-w-md">
					{#each ['🌟', '⚖️', '🔍', '💡', '🎯', '💝', '📊', '🤔', '⚡'] as avatar, i}
						<div 
							class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-lg animate-bounce shadow-lg"
							style="animation-delay: {i * 0.15}s"
						>
							{avatar}
						</div>
					{/each}
				</div>
				
				<div class="mt-6 text-sm text-gray-600">
					<div class="flex items-center justify-center space-x-2">
						<div class="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
						<span>Processing your query...</span>
						<div class="w-2 h-2 bg-orange-400 rounded-full animate-ping" style="animation-delay: 0.5s"></div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Results -->
	{#if responses.length > 0}
		<div class="space-y-12">
			<!-- Insight Summary -->
			{#if summary}
				<div class="glass-card shimmer p-10 mt-8">
					<div class="text-center mb-10">
						<h2 class="text-4xl font-bold gradient-text mb-4">Insight Summary</h2>
						<p class="text-xl text-gray-600 font-medium">Compiled wisdom from your 9 guardians</p>
					</div>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<!-- Left Column -->
						<div class="space-y-6">
							<!-- Overall Sentiment -->
							<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-4">Overall Sentiment</h3>
								<div class="text-center">
									<span class="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-medium capitalize">
										{summary.overallSentiment}
									</span>
								</div>
							</div>

							<!-- Main Themes -->
							<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-4">Key Themes</h3>
								<div class="space-y-2">
									{#each summary.mainThemes as theme}
										<div class="flex items-center space-x-2">
											<div class="w-2 h-2 rounded-full bg-orange-400"></div>
											<span class="text-gray-700">{theme}</span>
										</div>
									{/each}
								</div>
							</div>

							<!-- Consensus -->
							<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-4">Guardian Consensus</h3>
								<p class="text-gray-700 leading-relaxed">{summary.consensus}</p>
							</div>
						</div>

						<!-- Right Column -->
						<div class="space-y-6">
							<!-- Divergent Views -->
							{#if summary.divergentViews.length > 0}
								<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
									<h3 class="text-lg font-semibold text-gray-800 mb-4">Different Perspectives</h3>
									<div class="space-y-2">
										{#each summary.divergentViews as view}
											<div class="flex items-start space-x-2">
												<div class="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0"></div>
												<span class="text-gray-700">{view}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Action Items -->
							<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-4">Recommended Actions</h3>
								<div class="space-y-3">
									{#each summary.actionItems as action, index}
										<div class="flex items-start space-x-3">
											<div class="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
												{index + 1}
											</div>
											<span class="text-gray-700">{action}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Guardian Perspectives -->
			<div class="mb-12">
				<h2 class="text-4xl font-bold text-center gradient-text mb-4">Guardian Perspectives</h2>
				<p class="text-xl text-gray-600 font-medium text-center mb-10">Individual insights from each guardian</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{#each responses as response, index}
						<div class="guardian-card shimmer" style="animation-delay: {index * 0.1}s">
							<div class="flex items-center space-x-4 mb-6">
								<div class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl shadow-xl pulse-glow">
									{response.guardian.avatar}
								</div>
								<div class="flex-1">
									<h3 class="font-bold text-gray-800 text-xl mb-1">{response.guardian.name}</h3>
									<p class="text-sm text-gray-600 font-medium">{response.guardian.personality}</p>
								</div>
							</div>
							
							<div class="bg-white/40 rounded-3xl p-6 backdrop-blur-sm border border-white/20 shadow-inner">
								<p class="text-gray-800 leading-relaxed text-base font-medium">{response.response}</p>
							</div>
							
							<div class="mt-4 flex justify-between items-center text-xs text-gray-500">
								<span class="font-medium">{response.guardian.perspective}</span>
								<span>{new Date(response.timestamp).toLocaleTimeString()}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Guardian Preview (when no results) -->
	{#if responses.length === 0 && !isLoading}
		<div class="mt-20">
			<div class="text-center mb-12">
				<h2 class="text-4xl font-bold gradient-text mb-4">Meet Your Guardians</h2>
				<p class="text-xl text-gray-600 font-medium">Each brings a unique perspective to help you think deeper</p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each guardians as guardian, index}
					<div class="guardian-card opacity-80 hover:opacity-100 shimmer" style="animation-delay: {index * 0.1}s">
						<div class="flex items-center space-x-4 mb-6">
							<div class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl shadow-xl">
								{guardian.avatar}
							</div>
							<div>
								<h3 class="font-bold text-gray-800 text-lg">{guardian.name}</h3>
								<p class="text-sm text-gray-600 font-medium">{guardian.personality}</p>
							</div>
						</div>
						<div class="bg-white/30 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
							<p class="text-gray-700 font-medium leading-relaxed">{guardian.perspective}</p>
						</div>
					</div>
				{/each}
			</div>
			
			<!-- Call to action -->
			<div class="text-center mt-16">
				<div class="glass-card p-8 max-w-2xl mx-auto">
					<h3 class="text-2xl font-bold text-gray-800 mb-4">Ready to get started?</h3>
					<p class="text-lg text-gray-600 mb-6">Share your idea, question, or dilemma above and let our guardians provide their unique insights.</p>
					<div class="flex justify-center space-x-2">
						<div class="w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
						<div class="w-3 h-3 bg-orange-500 rounded-full opacity-80"></div>
						<div class="w-3 h-3 bg-orange-600 rounded-full opacity-60"></div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</main>

<!-- Floating Background Elements -->
<div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
	<!-- Large gradient orbs -->
	<div class="absolute top-1/4 left-1/4 w-80 h-80 liquid-gradient rounded-full opacity-20 blur-3xl floating-element"></div>
	<div class="absolute bottom-1/4 right-1/4 w-96 h-96 liquid-gradient rounded-full opacity-15 blur-3xl floating-element" style="animation-delay: 2s"></div>
	<div class="absolute top-3/4 left-1/2 w-64 h-64 liquid-gradient rounded-full opacity-25 blur-3xl floating-element" style="animation-delay: 4s"></div>
	
	<!-- Medium accent orbs -->
	<div class="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-r from-orange-300 to-orange-500 rounded-full opacity-10 blur-2xl floating-element" style="animation-delay: 1s"></div>
	<div class="absolute bottom-1/3 left-1/3 w-24 h-24 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-15 blur-xl floating-element" style="animation-delay: 3s"></div>
	
	<!-- Static accent elements -->
	<div class="absolute top-1/3 right-1/4 w-4 h-4 bg-orange-400 rounded-full opacity-20"></div>
	<div class="absolute bottom-1/2 left-1/5 w-3 h-3 bg-orange-500 rounded-full opacity-25"></div>
	<div class="absolute top-2/3 right-1/5 w-2 h-2 bg-orange-300 rounded-full opacity-30"></div>
	<div class="absolute bottom-1/4 left-2/3 w-3 h-3 bg-orange-600 rounded-full opacity-20"></div>
</div>

<!-- Authentication Modal -->
<AuthModal 
	isOpen={showAuthModal} 
	onClose={handleAuthClose}
	onSuccess={handleAuthSuccess}
	context={authContext}
/>

<!-- Upgrade Modal -->
<UpgradeModal 
	isOpen={showUpgradeModal}
	on:close={handleUpgradeClose}
	on:success={handleUpgradeSuccess}
/>