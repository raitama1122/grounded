<script lang="ts">
	import type { GuardianResponse } from '$lib/anthropic.js';

	let { response }: { response: GuardianResponse } = $props();
</script>

<div class="guardian-card">
	<div class="flex items-center space-x-4 mb-4">
		<div class="w-12 h-12 rounded-full {response.guardian.color} flex items-center justify-center text-2xl shadow-lg">
			{response.guardian.avatar}
		</div>
		<div class="flex-1">
			<h3 class="font-semibold text-gray-800 text-lg">{response.guardian.name}</h3>
			<p class="text-sm text-gray-600">{response.guardian.personality}</p>
		</div>
	</div>
	
	<div class="bg-white/30 rounded-2xl p-4 backdrop-blur-sm">
		<p class="text-gray-800 leading-relaxed">{response.response}</p>
	</div>
	
	<div class="mt-4 text-xs text-gray-500 text-right">
		{new Date(response.timestamp).toLocaleTimeString()}
	</div>
</div>
