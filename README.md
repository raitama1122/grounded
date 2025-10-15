# Grounded 🌟

**AI-powered analysis platform with 9 guardian perspectives**

Grounded is a sophisticated web application that provides comprehensive analysis of your ideas, plans, and questions through the lens of 9 distinct AI guardian personalities. Each guardian offers unique perspectives ranging from optimistic encouragement to critical analysis, helping you make well-informed decisions.

## ✨ Features

### 🤖 AI Guardian Analysis
- **9 Unique Guardians**: Each with distinct personalities and perspectives
  - 🌟 **The Optimist** - Sees potential and opportunities
  - ⚖️ **The Realist** - Focuses on facts and feasibility  
  - 🔍 **The Skeptic** - Challenges assumptions and finds flaws
  - 💡 **The Innovator** - Explores new possibilities and alternatives
  - 🎯 **The Strategist** - Provides systematic planning and analysis
  - ❤️ **The Empath** - Considers human impact and emotions
  - 💰 **The Economist** - Analyzes financial and economic aspects
  - 🤔 **The Philosopher** - Explores deeper meaning and ethics
  - ⚡ **The Executor** - Focuses on implementation and action

### 📊 Intelligent Insights
- **Comprehensive Summaries** with sentiment analysis
- **Guardian Scoring System** with numerical ratings (1-10 scale)
- **Key Themes Identification** across all perspectives
- **Actionable Recommendations** for next steps
- **Consensus & Divergent Views** analysis

### 🌐 Multi-language Support
- **Automatic Language Detection** - Responds in your query language
- **Global Accessibility** - Works with any language you speak
- **Cultural Context** - Guardians adapt to cultural nuances

### 👤 User Management
- **Anonymous Usage** - Try one query without registration
- **Secure Authentication** - Email/password with bcrypt encryption
- **Personal Dashboard** - View and manage your analysis history
- **Rate Limiting** - Fair usage policies with upgrade options

### 💎 Subscription Plans
- **Free Plan** - 10 daily queries for registered users
- **PRO Plan** - Unlimited queries for $5/month
- **Seamless Upgrades** - Instant plan activation

### 🎨 Modern UI/UX
- **Apple Liquid Glass Design** - Beautiful, modern interface
- **Mobile-First** - Responsive design for all devices
- **Tailwind CSS** - Clean, professional styling
- **Real-time Updates** - Instant analysis results

## 🚀 Technology Stack

### Frontend
- **SvelteKit** - Modern web framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tooling

### Backend & Database
- **Cloudflare D1** - Serverless SQL database
- **Cloudflare Workers** - Edge computing platform
- **Wrangler** - Development and deployment CLI

### AI & APIs
- **Anthropic Claude** - Advanced AI language model
- **Custom Guardian System** - Specialized AI personalities
- **Parallel Processing** - Simultaneous guardian responses

### Security & Performance
- **bcrypt** - Password hashing
- **Session Management** - Secure authentication
- **Rate Limiting** - Usage control and fairness
- **Analytics Tracking** - Usage insights and optimization

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Cloudflare account
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd grounded
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your actual API key
   # Get your API key from: https://console.anthropic.com/
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Create D1 database
   wrangler d1 create grounded-db
   
   # Execute schema
   wrangler d1 execute grounded-db --file=schema.sql --remote
   
   # Add seed data (optional)
   wrangler d1 execute grounded-db --file=seed.sql --remote
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Configuration Files

- **`wrangler.toml`** - Cloudflare configuration
- **`schema.sql`** - Database schema
- **`seed.sql`** - Sample data for testing
- **`tailwind.config.js`** - Styling configuration
- **`.env.example`** - Environment variables template
- **`.env`** - Your local environment variables (not committed to git)

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com | Yes | - |
| `CLAUDE_MODEL` | Claude model to use for AI responses | No | `claude-3-5-sonnet-20241022` |
| `ENVIRONMENT` | Application environment | No | `development` |

**Security Note**: Never commit your actual API keys to git. Use `.env` for local development and Cloudflare Pages environment variables for production.

## 📁 Project Structure

```
grounded/
├── src/
│   ├── lib/
│   │   ├── components/          # Reusable UI components
│   │   ├── anthropic.ts         # AI integration
│   │   ├── auth.ts             # Authentication service
│   │   ├── database.ts         # Database operations
│   │   ├── guardians.ts        # Guardian definitions
│   │   └── usage-tracker.ts    # Rate limiting
│   ├── routes/
│   │   ├── api/                # API endpoints
│   │   ├── analysis/[id]/      # Analysis results page
│   │   ├── dashboard/          # User dashboard
│   │   └── +page.svelte        # Homepage
│   └── app.css                 # Global styles
├── schema.sql                  # Database schema
├── seed.sql                   # Sample data
├── wrangler.toml              # Cloudflare config
└── package.json               # Dependencies
```

## 🚀 Deployment

### Cloudflare Pages Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare**
   ```bash
   wrangler pages deploy
   ```

3. **Configure Environment Variables in Cloudflare Pages Dashboard**
   - Navigate to your Pages project → Settings → Environment variables
   - Add `ANTHROPIC_API_KEY` with your Anthropic API key (keep this secret!)
   - Add `CLAUDE_MODEL` with your preferred model (e.g., `claude-3-5-sonnet-20241022`)
   - Environment variables are automatically available to your application

### Database Migration
```bash
# Deploy schema to production
wrangler d1 execute grounded-db --file=schema.sql --remote

# Optional: Add seed data
wrangler d1 execute grounded-db --file=seed.sql --remote
```

## 📊 API Endpoints

### Analysis
- `POST /api/guardians` - Submit query for analysis
- `GET /api/analysis/[id]` - Retrieve analysis results

### Authentication  
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/user/analyses` - Get user's analysis history
- `GET /api/usage` - Get usage statistics
- `POST /api/upgrade` - Upgrade to PRO plan
- `POST /api/analysis/claim` - Claim anonymous analysis

## 🎯 Guardian Personalities

Each guardian has a unique perspective and specialized focus:

| Guardian | Focus Area | Personality Traits |
|----------|------------|-------------------|
| 🌟 Optimist | Opportunities & Potential | Encouraging, enthusiastic, realistic |
| ⚖️ Realist | Facts & Feasibility | Balanced, practical, objective |
| 🔍 Skeptic | Risks & Challenges | Critical, questioning, constructive |
| 💡 Innovator | Creativity & Alternatives | Creative, boundary-pushing, experimental |
| 🎯 Strategist | Planning & Execution | Systematic, analytical, structured |
| ❤️ Empath | Human Impact | Caring, inclusive, emotionally aware |
| 💰 Economist | Financial Analysis | Value-focused, market-aware, ROI-driven |
| 🤔 Philosopher | Ethics & Meaning | Thoughtful, principled, wisdom-seeking |
| ⚡ Executor | Implementation | Action-oriented, results-driven, practical |

## 🔒 Security Features

- **Password Encryption** - bcrypt with salt rounds
- **Session Management** - Secure HTTP-only cookies
- **Rate Limiting** - Prevents abuse and ensures fair usage
- **Input Validation** - Comprehensive request validation
- **CSRF Protection** - Cross-site request forgery prevention
- **Content Safety** - AI safety guidelines and content filtering

## 📈 Analytics & Monitoring

- **Usage Tracking** - Query counts and patterns
- **Performance Metrics** - Response times and success rates
- **User Behavior** - Analysis views, shares, and engagement
- **Error Monitoring** - Comprehensive error logging and tracking

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and standards
- Pull request process
- Issue reporting
- Feature requests

## 📄 License

This project is proprietary software. All rights reserved.

## 👨‍💻 Author

**Bachtiar Rifai**  
📧 [b@majumapan.net](mailto:b@majumapan.net)

## 🙏 Acknowledgments

- **Anthropic** - For the powerful Claude AI models
- **Cloudflare** - For the robust edge computing platform
- **Svelte Team** - For the excellent web framework
- **Tailwind CSS** - For the beautiful utility-first CSS framework

---

**Built with ❤️ using modern web technologies**