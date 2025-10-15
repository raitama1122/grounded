import Anthropic from '@anthropic-ai/sdk';
import { config, getConfigWithPlatform } from './config.js';
import { guardians, type Guardian } from './guardians.js';

// Create a function to get Anthropic client with platform bindings
function getAnthropicClient(platform?: any) {
  const configWithPlatform = getConfigWithPlatform(platform);
  return new Anthropic({
    apiKey: configWithPlatform.anthropicApiKey,
  });
}

// Default client for backward compatibility
const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

export interface GuardianResponse {
  guardian: Guardian;
  response: string;
  timestamp: Date;
}

export async function getGuardianResponse(guardian: Guardian, userQuery: string, platform?: any): Promise<GuardianResponse> {
  try {
    const anthropicClient = getAnthropicClient(platform);
    const configWithPlatform = getConfigWithPlatform(platform);
    
    const message = await anthropicClient.messages.create({
      model: configWithPlatform.claudeModel,
      max_tokens: 200,
      temperature: 0.7,
      system: guardian.systemPrompt,
      messages: [
        {
          role: 'user',
          content: userQuery
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      guardian,
      response: responseText,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`Error getting response from ${guardian.name}:`, error);
    return {
      guardian,
      response: `I'm having trouble connecting right now. Please try again later.`,
      timestamp: new Date()
    };
  }
}

export async function getAllGuardianResponses(userQuery: string, platform?: any): Promise<GuardianResponse[]> {
  const promises = guardians.map(guardian => getGuardianResponse(guardian, userQuery, platform));
  
  try {
    const responses = await Promise.all(promises);
    return responses;
  } catch (error) {
    console.error('Error getting guardian responses:', error);
    throw error;
  }
}

export interface InsightSummary {
  mainThemes: string[];
  consensus: string;
  divergentViews: string[];
  actionItems: string[];
  overallSentiment: string;
  sentimentDetails: {
    tone: string;
    confidence: string;
    nuance: string;
  };
  guardianScores?: {
    aspects: Array<{
      name: string;
      score: number; // 1-10 scale
      supportCount: number; // how many guardians support this
      concerns: string[];
    }>;
    overallScore: number;
  };
}

export async function generateInsightSummary(responses: GuardianResponse[], originalQuery: string, platform?: any): Promise<InsightSummary> {
  const combinedResponses = responses.map(r => `${r.guardian.name}: ${r.response}`).join('\n\n');
  
  const summaryPrompt = `Based on these 9 different perspectives on the query "${originalQuery}", create a comprehensive insight summary.

IMPORTANT: Respond in the same language as the original query "${originalQuery}". If the query is in Indonesian, respond in Indonesian. If it's in English, respond in English, etc.

${combinedResponses}

Please analyze and provide:
1. Main themes that emerged across responses
2. Areas of consensus among the guardians
3. Notable divergent viewpoints
4. Key action items or recommendations
5. Detailed sentiment analysis with precise descriptors
6. Guardian scoring analysis for key aspects

For the guardian scoring, analyze the responses and identify key aspects/options/ideas mentioned in the query, then score each based on guardian opinions:
- Score each aspect on a 1-10 scale based on guardian sentiment
- Count how many guardians support vs have concerns about each aspect
- List specific concerns raised by guardians
- Calculate an overall score

For sentiment analysis, provide a concise point-by-point breakdown based on guardian responses. Use precise descriptors like:
- "Cautiously Optimistic" - hopeful but with reservations
- "Constructively Critical" - pointing out issues while offering solutions
- "Enthusiastically Supportive" - strongly positive and encouraging
- "Analytically Neutral" - objective, data-driven assessment
- "Pragmatically Realistic" - balanced view acknowledging both pros and cons
- "Strategically Concerned" - worried but focused on solutions
- "Confidently Encouraging" - positive with strong conviction
- "Thoughtfully Balanced" - carefully weighing multiple factors
- "Cautiously Skeptical" - doubtful but open to evidence
- "Constructively Engaged" - actively involved in problem-solving

Format your response as JSON with the following structure:
{
  "mainThemes": ["theme1", "theme2", "theme3"],
  "consensus": "brief summary of what most guardians agreed on",
  "divergentViews": ["view1", "view2"],
  "actionItems": ["action1", "action2", "action3"],
  "overallSentiment": "precise sentiment descriptor (e.g., 'Cautiously Optimistic')",
  "sentimentDetails": {
    "tone": "brief description of the overall tone",
    "confidence": "level of certainty in the responses (high/medium/low)",
    "nuance": "key nuances or subtleties in the sentiment"
  },
  "guardianScores": {
    "aspects": [
      {
        "name": "aspect name (e.g., 'Feasibility', 'Cost-effectiveness', 'Risk level')",
        "score": 7.5,
        "supportCount": 6,
        "concerns": ["concern1", "concern2"]
      }
    ],
    "overallScore": 7.2
  }
}`;

  try {
    const anthropicClient = getAnthropicClient(platform);
    const configWithPlatform = getConfigWithPlatform(platform);
    
    const message = await anthropicClient.messages.create({
      model: configWithPlatform.claudeModel,
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: summaryPrompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating insight summary:', error);
    return {
      mainThemes: ['Analysis pending'],
      consensus: 'Unable to generate summary at this time',
      divergentViews: [],
      actionItems: ['Try asking your question again'],
      overallSentiment: 'Analytically Neutral',
      sentimentDetails: {
        tone: 'Processing',
        confidence: 'low',
        nuance: 'Analysis is still being processed'
      },
      guardianScores: {
        aspects: [],
        overallScore: 5.0
      }
    };
  }
}
