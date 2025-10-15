<div class="flex flex-col items-center justify-center py-16">
	<div class="relative">
		<!-- Main spinner -->
		<div class="w-16 h-16 border-4 border-spark-200 border-t-spark-500 rounded-full animate-spin"></div>
		
		<!-- Inner pulse -->
		<div class="absolute inset-2 w-8 h-8 bg-spark-400 rounded-full animate-pulse opacity-60"></div>
	</div>
	
	<div class="mt-8 text-center">
		<h3 class="text-xl font-semibold text-gray-800 mb-2">Consulting the Guardians</h3>
		<p class="text-gray-600">Getting diverse perspectives on your idea...</p>
		
		<!-- Guardian avatars animation -->
		<div class="flex justify-center space-x-2 mt-6">
			{#each ['🌟', '⚖️', '🔍', '💡', '🎯', '💝', '📊', '🤔', '⚡'] as avatar, i}
				<div 
					class="w-8 h-8 rounded-full bg-gradient-to-br from-spark-400 to-spark-600 flex items-center justify-center text-sm animate-bounce"
					style="animation-delay: {i * 0.1}s"
				>
					{avatar}
				</div>
			{/each}
		</div>
	</div>
</div>
