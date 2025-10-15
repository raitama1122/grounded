// Environment configuration
export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'
};

// Function to get config with platform bindings (for Cloudflare Workers/Pages)
export function getConfigWithPlatform(platform?: any) {
  const anthropicApiKey = platform?.env?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
  const claudeModel = platform?.env?.CLAUDE_MODEL || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  
  return {
    anthropicApiKey,
    claudeModel
  };
}

// Debug logging for environment variables (only in development)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('Config loaded:', {
    hasApiKey: !!config.anthropicApiKey,
    apiKeyLength: config.anthropicApiKey.length,
    claudeModel: config.claudeModel
  });
}
