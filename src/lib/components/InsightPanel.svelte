<script lang="ts">
	import type { InsightSummary } from '$lib/anthropic.js';

	let { summary, query }: { summary: InsightSummary; query: string } = $props();

	function getSentimentColor(sentiment: string) {
		switch (sentiment) {
			case 'positive':
				return 'from-green-400 to-emerald-500';
			case 'negative':
				return 'from-red-400 to-pink-500';
			default:
				return 'from-blue-400 to-indigo-500';
		}
	}

	function getSentimentIcon(sentiment: string) {
		switch (sentiment) {
			case 'positive':
				return '😊';
			case 'negative':
				return '😐';
			default:
				return '🤔';
		}
	}
</script>

<div class="glass-card p-8 mt-12">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold text-gray-800 mb-2">Insight Summary</h2>
		<p class="text-gray-600">Compiled wisdom from your 9 guardians</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Left Column -->
		<div class="space-y-6">
			<!-- Overall Sentiment -->
			<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
				<div class="flex items-center space-x-3 mb-4">
					<div class="w-10 h-10 rounded-full bg-gradient-to-r {getSentimentColor(summary.overallSentiment)} flex items-center justify-center text-xl">
						{getSentimentIcon(summary.overallSentiment)}
					</div>
					<h3 class="text-lg font-semibold text-gray-800">Overall Sentiment</h3>
				</div>
				<div class="text-center">
					<span class="inline-block px-4 py-2 rounded-full bg-gradient-to-r {getSentimentColor(summary.overallSentiment)} text-white font-medium capitalize">
						{summary.overallSentiment}
					</span>
				</div>
			</div>

			<!-- Main Themes -->
			<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
				<h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
					<span class="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 mr-3"></span>
					Key Themes
				</h3>
				<div class="space-y-2">
					{#each summary.mainThemes as theme}
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 rounded-full bg-spark-400"></div>
							<span class="text-gray-700">{theme}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Consensus -->
			<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
				<h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
					<span class="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mr-3"></span>
					Guardian Consensus
				</h3>
				<p class="text-gray-700 leading-relaxed">{summary.consensus}</p>
			</div>
		</div>

		<!-- Right Column -->
		<div class="space-y-6">
			<!-- Divergent Views -->
			{#if summary.divergentViews.length > 0}
				<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
					<h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
						<span class="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-500 mr-3"></span>
						Different Perspectives
					</h3>
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
				<h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
					<span class="w-6 h-6 rounded-full bg-gradient-to-r from-spark-400 to-yellow-500 mr-3"></span>
					Recommended Actions
				</h3>
				<div class="space-y-3">
					{#each summary.actionItems as action, index}
						<div class="flex items-start space-x-3">
							<div class="w-6 h-6 rounded-full bg-spark-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
								{index + 1}
							</div>
							<span class="text-gray-700">{action}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Share/Export Options -->
			<div class="bg-white/40 rounded-2xl p-6 backdrop-blur-sm">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Share Your Insights</h3>
				<div class="flex space-x-3">
					<button class="glass-button text-sm bg-gradient-to-r from-blue-500 to-blue-600 flex-1">
						📱 Share
					</button>
					<button class="glass-button text-sm bg-gradient-to-r from-green-500 to-green-600 flex-1">
						💾 Save
					</button>
					<button class="glass-button text-sm bg-gradient-to-r from-purple-500 to-purple-600 flex-1">
						🖼️ Export
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Visual Summary Stats -->
	<div class="mt-8 pt-8 border-t border-white/30">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
			<div class="bg-white/30 rounded-xl p-4">
				<div class="text-2xl font-bold text-spark-600">9</div>
				<div class="text-sm text-gray-600">Guardians</div>
			</div>
			<div class="bg-white/30 rounded-xl p-4">
				<div class="text-2xl font-bold text-spark-600">{summary.mainThemes.length}</div>
				<div class="text-sm text-gray-600">Key Themes</div>
			</div>
			<div class="bg-white/30 rounded-xl p-4">
				<div class="text-2xl font-bold text-spark-600">{summary.actionItems.length}</div>
				<div class="text-sm text-gray-600">Action Items</div>
			</div>
			<div class="bg-white/30 rounded-xl p-4">
				<div class="text-2xl font-bold text-spark-600">{summary.divergentViews.length}</div>
				<div class="text-sm text-gray-600">Diverse Views</div>
			</div>
		</div>
	</div>
</div>
