-- Seed data for Grounded database
-- This file contains sample data for testing and development

-- Sample analysis
INSERT INTO analyses (id, query, status, user_ip, user_agent) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Should I start a food truck business?',
    'completed',
    '127.0.0.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
);

-- Sample guardian responses for the analysis
INSERT INTO guardian_responses (analysis_id, guardian_id, guardian_name, guardian_avatar, guardian_personality, guardian_perspective, response) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'optimist',
    'The Optimist',
    '🌟',
    'Enthusiastic and encouraging',
    'Sees potential and opportunities',
    'A food truck business is an exciting venture with incredible potential! You''ll have the freedom to be creative with your menu, connect directly with customers, and build a loyal following. The lower startup costs compared to a traditional restaurant make this an accessible way to enter the food industry. Go for it!'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'realist',
    'The Realist',
    '⚖️',
    'Practical and grounded',
    'Focuses on facts and feasibility',
    'Food trucks require significant upfront investment ($50k-$200k), proper licensing, and consistent locations with foot traffic. Success depends on menu differentiation, weather conditions, and local regulations. Research your local market thoroughly and ensure you have 6-12 months of operating capital before starting.'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'skeptic',
    'The Skeptic',
    '🔍',
    'Critical and questioning',
    'Challenges assumptions and finds flaws',
    'Food trucks face intense competition, unpredictable income, and operational challenges like equipment breakdowns and permit issues. Many fail within the first year due to underestimating costs and overestimating demand. Have you considered the long hours, physical demands, and seasonal fluctuations?'
);

-- Sample insight summary
INSERT INTO insight_summaries (analysis_id, main_themes, consensus, divergent_views, action_items, overall_sentiment) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    '["Market research", "Financial planning", "Operational challenges", "Creative opportunities"]',
    'Most guardians agree that thorough market research and financial planning are essential before starting a food truck business.',
    '["The Optimist emphasizes creative potential while The Skeptic warns about high failure rates", "Views differ on risk tolerance and market opportunities"]',
    '["Conduct detailed market research", "Secure adequate funding (6-12 months operating capital)", "Research local regulations and permits", "Develop a unique menu concept", "Create a solid business plan"]',
    'neutral'
);

-- Sample analytics events
INSERT INTO analytics (event_type, analysis_id, metadata) VALUES
('query_submitted', '550e8400-e29b-41d4-a716-446655440000', '{"query_length": 35, "guardians_count": 9}'),
('analysis_viewed', '550e8400-e29b-41d4-a716-446655440000', '{"view_duration": 120, "device": "desktop"}');
