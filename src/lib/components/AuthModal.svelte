<script lang="ts">
  import { authService } from '$lib/stores/user.js';
  
  export let isOpen = false;
  export let onClose: () => void;
  export let onSuccess: (() => void) | undefined = undefined;
  export let context: 'general' | 'my-ideas' | 'new-analysis' | 'continue-analysis' = 'general';

  let email = '';
  let name = '';
  let password = '';
  let confirmPassword = '';
  let isLoading = false;
  let error = '';
  let isLoginMode = true; // true for login, false for register

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      error = 'Please fill in all required fields';
      return;
    }

    if (!isLoginMode) {
      if (!name.trim()) {
        error = 'Please enter your name';
        return;
      }
      if (password !== confirmPassword) {
        error = 'Passwords do not match';
        return;
      }
      if (password.length < 6) {
        error = 'Password must be at least 6 characters';
        return;
      }
    }

    isLoading = true;
    error = '';

    try {
      let result;
      
      if (isLoginMode) {
        result = await authService.login(email.trim(), password);
      } else {
        result = await authService.register(email.trim(), name.trim(), password);
      }

      if (result.success) {
        // Reset form
        email = '';
        name = '';
        password = '';
        confirmPassword = '';
        
        // Call success callback if provided, otherwise just close
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      } else {
        error = result.error || (isLoginMode ? 'Login failed' : 'Registration failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      error = 'An unexpected error occurred';
    }

    isLoading = false;
  }

  function toggleMode() {
    isLoginMode = !isLoginMode;
    error = '';
    password = '';
    confirmPassword = '';
  }

  // Context-aware messaging
  $: contextMessages = {
    'general': {
      loginTitle: 'Welcome Back',
      registerTitle: 'Join Grounded',
      loginSubtitle: 'Sign in to access your saved ideas - it\'s free',
      registerSubtitle: 'Create a free account to save your insights'
    },
    'my-ideas': {
      loginTitle: 'Access Your Ideas',
      registerTitle: 'Save Your Ideas',
      loginSubtitle: 'Sign in to view your saved analyses - it\'s free',
      registerSubtitle: 'Create a free account to save and organize your ideas'
    },
    'new-analysis': {
      loginTitle: 'Continue Your Journey',
      registerTitle: 'Keep Going',
      loginSubtitle: 'Sign in to continue - it\'s free',
      registerSubtitle: 'Create a free account to save your ideas and continue'
    },
    'continue-analysis': {
      loginTitle: 'Continue Using Grounded',
      registerTitle: 'Keep Your Ideas Safe',
      loginSubtitle: 'Login to continue using, save your ideas and more... it\'s free',
      registerSubtitle: 'Create a free account to save your ideas and continue using Grounded'
    }
  };

  $: currentMessage = contextMessages[context];

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="auth-modal-title"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div class="glass-card p-8 w-full max-w-md mx-auto shadow-2xl border-2 border-white/30 bg-white/95 backdrop-blur-xl">
      <div class="text-center mb-6">
        <h2 id="auth-modal-title" class="text-2xl font-bold gradient-text mb-2">
          {isLoginMode ? currentMessage.loginTitle : currentMessage.registerTitle}
        </h2>
        <p class="text-gray-600">
          {isLoginMode ? currentMessage.loginSubtitle : currentMessage.registerSubtitle}
        </p>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Email Input -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
            placeholder="your@email.com"
            disabled={isLoading}
          />
        </div>

        <!-- Name Input (only for registration) -->
        {#if !isLoginMode}
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              bind:value={name}
              required
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>
        {/if}

        <!-- Password Input -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>

        <!-- Confirm Password Input (only for registration) -->
        {#if !isLoginMode}
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              required
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
              placeholder="Confirm your password"
              disabled={isLoading}
            />
          </div>
        {/if}

        <!-- Error Message -->
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-xl p-3">
            <p class="text-red-600 text-sm">{error}</p>
          </div>
        {/if}

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={isLoading}
          class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {#if isLoading}
            <div class="flex items-center justify-center space-x-2">
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{isLoginMode ? 'Signing in...' : 'Creating account...'}</span>
            </div>
          {:else}
            {isLoginMode ? 'Sign In' : 'Create Account'}
          {/if}
        </button>
      </form>

      <!-- Mode Toggle -->
      <div class="mt-4 text-center">
        <p class="text-gray-600 text-sm">
          {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            on:click={toggleMode}
            class="text-orange-600 hover:text-orange-700 font-medium ml-1 underline"
            disabled={isLoading}
          >
            {isLoginMode ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <!-- Close Button -->
      <button
        on:click={onClose}
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm"
        aria-label="Close modal"
      >
        <span class="text-gray-600 font-bold">✕</span>
      </button>

      <!-- Info Text -->
      <p class="text-xs text-gray-500 text-center mt-4">
        We'll create an account for you automatically if this is your first time.
      </p>
    </div>
  </div>
{/if}
