<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user.js';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import type { GuardianResponse, InsightSummary } from '$lib/anthropic.js';

	let loading = true;
	let error = '';
	let showAuthModal = false;
	let pendingAction: 'dashboard' | 'new' | null = null;
	let authContext: 'general' | 'my-ideas' | 'new-analysis' | 'continue-analysis' = 'general';
	let analysisData: {
		id: string;
		query: string;
		responses: GuardianResponse[];
		summary: InsightSummary | null;
		created_at: string;
		status: string;
		user_id?: string | null;
	} | null = null;

	onMount(async () => {
		const analysisId = $page.params.id;
		
		try {
			const response = await fetch(`/api/analysis/${analysisId}`);
			
			if (!response.ok) {
				if (response.status === 404) {
					error = 'Analysis not found. This link may be invalid or expired.';
				} else {
					error = 'Failed to load analysis. Please try again later.';
				}
				return;
			}

			analysisData = await response.json();
		} catch (err) {
			error = 'Failed to load analysis. Please check your connection.';
			console.error('Error loading analysis:', err);
		} finally {
			loading = false;
		}
	});

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleNewAnalysis() {
		if ($user) {
			goto('/');
		} else {
			pendingAction = 'new';
			authContext = 'new-analysis';
			showAuthModal = true;
		}
	}

	function handleViewMyAnalyses() {
		if ($user) {
			goto('/dashboard');
		} else {
			pendingAction = 'dashboard';
			authContext = 'my-ideas';
			showAuthModal = true;
		}
	}

	async function handleAuthSuccess() {
		showAuthModal = false;
		
		// Check if this analysis can be claimed by the newly authenticated user
		if (analysisData && !analysisData.user_id) {
			try {
				const response = await fetch('/api/analysis/claim', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ analysisId: analysisData.id }),
				});
				
				if (response.ok) {
					// Successfully claimed the analysis, reload the page to show updated data
					window.location.reload();
					return;
				}
			} catch (err) {
				console.error('Failed to claim analysis:', err);
			}
		}
		
		if (pendingAction === 'dashboard') {
			goto('/dashboard');
		} else if (pendingAction === 'new') {
			goto('/');
		}
		
		pendingAction = null;
	}

	function handleAuthClose() {
		showAuthModal = false;
		pendingAction = null;
	}

	function shareAnalysis() {
		if (navigator.share) {
			navigator.share({
				title: 'Grounded Analysis',
				text: `Check out this analysis: "${analysisData?.query}"`,
				url: window.location.href
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			// You could show a toast notification here
		}
	}
</script>

<svelte:head>
	<title>{analysisData ? `Analysis: ${analysisData.query}` : 'Loading Analysis'} - Grounded</title>
	<meta name="description" content={analysisData ? `AI guardian analysis of: ${analysisData.query}` : 'Loading analysis...'} />
</svelte:head>

<main class="min-h-screen px-4 py-8 max-w-6xl mx-auto">
	<!-- Header with Query as Title -->
	<div class="text-center mb-12">
		<div class="floating-element mb-8">
			{#if analysisData}
				<div class="max-w-4xl mx-auto mb-6">
					<h1 class="text-2xl md:text-4xl font-black gradient-text mb-2 tracking-tight leading-tight">
						Analysis for
					</h1>
					<div class="text-3xl md:text-5xl font-bold text-gray-800 leading-tight">
						"{analysisData.query.charAt(0).toUpperCase() + analysisData.query.slice(1)}"
					</div>
				</div>
				<div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
					<p class="text-lg text-gray-600 font-medium">
						Created {formatDate(analysisData.created_at)}
					</p>
					<!-- Compact Action Buttons -->
					<div class="flex items-center space-x-2">
						<button
							on:click={shareAnalysis}
							class="group flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full sm:rounded-xl text-gray-700 hover:bg-blue-50/50 hover:border-blue-200/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
							title="Share Analysis"
						>
							<span class="text-lg group-hover:scale-110 transition-transform duration-200">📤</span>
							<span class="hidden sm:inline sm:ml-2 text-sm font-medium">Share</span>
						</button>
						<button
							on:click={handleViewMyAnalyses}
							class="group flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full sm:rounded-xl text-gray-700 hover:bg-purple-50/50 hover:border-purple-200/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
							title="View My Analyses"
						>
							<span class="text-lg group-hover:scale-110 transition-transform duration-200">📊</span>
							<span class="hidden sm:inline sm:ml-2 text-sm font-medium">My Ideas</span>
						</button>
						<button
							on:click={handleNewAnalysis}
							class="group flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full sm:rounded-xl text-gray-700 hover:bg-green-50/50 hover:border-green-200/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
							title="New Analysis"
						>
							<span class="text-lg group-hover:scale-110 transition-transform duration-200">✨</span>
							<span class="hidden sm:inline sm:ml-2 text-sm font-medium">New</span>
						</button>
					</div>
				</div>
			{:else}
				<h1 class="text-4xl md:text-6xl font-black gradient-text mb-4 tracking-tight">
					Analysis Results
				</h1>
			{/if}
		</div>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="glass-card p-12 mb-12 text-center">
			<div class="flex flex-col items-center justify-center">
				<div class="relative mb-8">
					<div class="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
					<div class="absolute inset-3 w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse"></div>
				</div>
				<h3 class="text-2xl font-bold text-gray-800 mb-3 gradient-text">Loading Analysis</h3>
				<p class="text-lg text-gray-700 font-medium">Retrieving your saved results...</p>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="glass-card p-12 mb-12 text-center">
			<div class="mb-6">
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<span class="text-2xl">❌</span>
				</div>
				<h3 class="text-2xl font-bold text-gray-800 mb-3">Analysis Not Found</h3>
				<p class="text-lg text-gray-600 mb-6">{error}</p>
				<a href="/" class="glass-button bg-gradient-to-r from-orange-500 to-orange-600">
					← Back to Home
				</a>
			</div>
		</div>
	{:else if analysisData}
		<!-- Results -->
		<div class="space-y-8">
			<!-- Insight Summary -->
			{#if analysisData.summary}
				<div class="glass-card shimmer p-6 mt-6">
					<div class="text-center mb-6">
						<h2 class="text-3xl font-bold gradient-text mb-2">Insight Summary</h2>
						<p class="text-lg text-gray-600 font-medium">Compiled wisdom from your 9 guardians</p>
					</div>

					<!-- Symmetric 3x2 Grid Layout -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
						<!-- Overall Score -->
						{#if analysisData.summary.guardianScores && analysisData.summary.guardianScores.aspects.length > 0}
							<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-3">Overall Score</h3>
								<div class="text-center">
									<div class="text-3xl font-bold text-gray-800 mb-2">
										{analysisData.summary.guardianScores.overallScore.toFixed(1)}/10
									</div>
									<div class="text-xs text-gray-600 uppercase tracking-wide">Guardian Average</div>
								</div>
							</div>

							<!-- Individual Aspect Scores -->
							{#each analysisData.summary.guardianScores.aspects as aspect, index}
								<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
									<h3 class="text-lg font-semibold text-gray-800 mb-3">{aspect.name}</h3>
									<div class="space-y-2">
										<div class="flex justify-between items-center">
											<span class="text-2xl font-bold text-gray-800">{aspect.score}/10</span>
											<span class="text-xs text-gray-500">({aspect.supportCount}/9 guardians)</span>
										</div>
										<div class="w-full bg-gray-200 rounded-full h-2">
											<div class="bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 h-2 rounded-full transition-all duration-300" style="width: {aspect.score * 10}%"></div>
										</div>
										{#if aspect.concerns.length > 0}
											<div class="text-xs text-gray-600 leading-snug">
												<span class="font-medium">Concerns:</span> {aspect.concerns.join(', ')}
											</div>
										{/if}
									</div>
								</div>
							{/each}
						{:else}
							<!-- Fallback to Overall Sentiment -->
							<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-3">Overall Sentiment</h3>
								<div class="text-center mb-3">
									<span class="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 text-white font-medium text-sm">
										{analysisData.summary.overallSentiment}
									</span>
								</div>
								{#if analysisData.summary.sentimentDetails}
									<div class="text-sm text-gray-700 space-y-1">
										<p><span class="font-medium">Tone:</span> {analysisData.summary.sentimentDetails.tone}</p>
										<p><span class="font-medium">Confidence:</span> {analysisData.summary.sentimentDetails.confidence}</p>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Key Themes -->
						<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
							<h3 class="text-lg font-semibold text-gray-800 mb-3">Key Themes</h3>
							<div class="space-y-2">
								{#each analysisData.summary.mainThemes as theme, index}
									<div class="flex items-start space-x-2">
										<span class="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
											{index + 1}
										</span>
										<span class="text-gray-700 text-sm leading-snug">{theme}</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Different Perspectives -->
						{#if analysisData.summary.divergentViews.length > 0}
							<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-3">Different Perspectives</h3>
								<div class="space-y-2">
									{#each analysisData.summary.divergentViews as view}
										<div class="flex items-start space-x-2">
											<div class="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
											<span class="text-gray-700 text-sm leading-snug">{view}</span>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<!-- Placeholder for symmetry when no divergent views -->
							<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-3">Guardian Consensus</h3>
								<p class="text-gray-700 text-sm leading-snug">{analysisData.summary.consensus}</p>
							</div>
						{/if}

						<!-- Recommended Actions -->
						<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
							<h3 class="text-lg font-semibold text-gray-800 mb-3">Recommended Actions</h3>
							<div class="space-y-2">
								{#each analysisData.summary.actionItems as action, index}
									<div class="flex items-start space-x-2">
										<span class="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
											{index + 1}
										</span>
										<span class="text-gray-700 text-sm leading-snug">{action}</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Guardian Consensus (only if divergent views exist) -->
						{#if analysisData.summary.divergentViews.length > 0}
							<div class="bg-white/60 rounded-xl p-4 backdrop-blur-md border border-white/50 shadow-sm">
								<h3 class="text-lg font-semibold text-gray-800 mb-3">Guardian Consensus</h3>
								<p class="text-gray-700 text-sm leading-snug">{analysisData.summary.consensus}</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Guardian Perspectives -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-center gradient-text mb-1">Guardian Perspectives</h2>
				<p class="text-base text-gray-600 font-medium text-center mb-6">Individual insights from each guardian</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each analysisData.responses as response, index}
						<div class="guardian-card bg-white/60 rounded-xl p-3 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-md transition-shadow duration-200">
							<div class="flex items-center space-x-2 mb-2">
								<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-base">
									{response.guardian.avatar}
								</div>
								<div class="flex-1">
									<h3 class="font-semibold text-gray-700 text-sm">{response.guardian.name}</h3>
									<p class="text-xs text-gray-500">{response.guardian.personality}</p>
								</div>
							</div>
							
							<p class="text-gray-600 text-sm leading-relaxed mb-2">{response.response}</p>
							
							<div class="flex justify-between items-center text-xs text-gray-400">
								<span class="font-medium">{response.guardian.perspective}</span>
								<span>{new Date(response.timestamp).toLocaleTimeString()}</span>
							</div>
						</div>
					{/each}
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
	
	<!-- Small sparkle elements -->
	<div class="absolute top-1/3 right-1/4 w-4 h-4 bg-orange-400 rounded-full opacity-30 animate-pulse"></div>
	<div class="absolute bottom-1/2 left-1/5 w-3 h-3 bg-orange-500 rounded-full opacity-40 animate-pulse" style="animation-delay: 1.5s"></div>
	<div class="absolute top-2/3 right-1/5 w-2 h-2 bg-orange-300 rounded-full opacity-50 animate-pulse" style="animation-delay: 2.5s"></div>
	<div class="absolute bottom-1/4 left-2/3 w-3 h-3 bg-orange-600 rounded-full opacity-35 animate-pulse" style="animation-delay: 0.8s"></div>
</div>

<!-- Authentication Modal -->
<AuthModal 
	isOpen={showAuthModal} 
	onClose={handleAuthClose}
	onSuccess={handleAuthSuccess}
	context={authContext}
/>
