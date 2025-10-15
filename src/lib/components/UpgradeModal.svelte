<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let isOpen = false;
  
  const dispatch = createEventDispatcher();
  
  let isProcessing = false;
  let error = '';
  let success = false;
  
  async function handleUpgrade() {
    if (isProcessing) return;
    
    isProcessing = true;
    error = '';
    
    try {
      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: 'demo_success' // In real app, this would be Stripe token
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        success = true;
        
        // Wait a moment to show success message
        setTimeout(() => {
          dispatch('success', data);
          handleClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        error = errorData.error || 'Upgrade failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
      console.error('Upgrade error:', err);
    } finally {
      isProcessing = false;
    }
  }
  
  function handleClose() {
    if (isProcessing) return;
    isOpen = false;
    error = '';
    success = false;
    dispatch('close');
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    tabindex="-1"
  >
    <!-- Modal -->
    <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/30 w-full max-w-md p-6 transform transition-all duration-300">
      {#if success}
        <!-- Success State -->
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Welcome to PRO! 🎉</h3>
          <p class="text-gray-600">You now have unlimited daily questions.</p>
        </div>
      {:else}
        <!-- Upgrade Form -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">✨</span>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Upgrade to PRO</h3>
          <p class="text-gray-600">Unlock unlimited daily questions and premium features</p>
        </div>

        <!-- Pricing -->
        <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-4 mb-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-900 mb-1">$5<span class="text-lg font-normal text-purple-700">/month</span></div>
            <p class="text-sm text-purple-700">Billed monthly • Cancel anytime</p>
          </div>
        </div>

        <!-- Features -->
        <div class="space-y-3 mb-6">
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm text-gray-700">Unlimited daily questions</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm text-gray-700">Priority support</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm text-gray-700">Advanced analytics</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm text-gray-700">Export analysis results</span>
          </div>
        </div>

        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}

        <!-- Demo Notice -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p class="text-xs text-blue-700">
            <strong>Demo Mode:</strong> This is a demonstration. No real payment will be processed.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            on:click={handleClose}
            disabled={isProcessing}
            class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            on:click={handleUpgrade}
            disabled={isProcessing}
            class="flex-1 px-4 py-3 text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {#if isProcessing}
              <span class="flex items-center justify-center space-x-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </span>
            {:else}
              Upgrade to PRO
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
