# Full Stack AI SEO Rank Tracker — Part 2: Feature Descriptions

> **Continued from:** [Part 1](./01-project-overview-and-architecture.md)

---

## Phase 1: Foundation & Authentication

### 1.1 MERN Stack Authentication System

**Purpose:** Secure user registration, login, and session management with JWT + refresh token rotation.

**Why Essential:** Every multi-user SaaS requires identity management. SEO data (competitor keywords, ranking strategies) must be protected per-user. Subscription tiers gate access to premium features.

**Core Functionalities:**
- Registration with email verification (Resend/Nodemailer)
- Login returning JWT access token (15 min, in-memory) + refresh token (7 days, HttpOnly cookie)
- Refresh token rotation — one-time-use tokens stored in MongoDB
- Password reset flow via email
- Google OAuth 2.0 social login
- Role-based access control (Free / Pro / Enterprise / Admin)
- Logout with server-side token invalidation
- Axios interceptor for auto-refresh on 401

**Recommended Libraries:**
`jsonwebtoken`, `bcryptjs`, `express-rate-limit`, `cookie-parser`, `passport-google-oauth20`, `Resend`

**Challenges & Solutions:**

| Challenge | Solution |
|-----------|----------|
| Token theft via XSS | Never store in localStorage; use HttpOnly cookies |
| Replay attacks | Refresh token rotation; invalidate family on reuse |
| Race conditions on refresh | Queue concurrent requests; only first generates new tokens |

---

### 1.2 MongoDB Database Schema Design

**Purpose:** Design a scalable data model for users, websites, keywords, rankings, audits, backlinks, and AI reports.

**Why Essential:** Must efficiently support time-series ranking data, complex analytics queries, and flexible SEO audit results that vary per page.

**Core Functionalities:**
- User collection with subscription tiers and API limits
- Website/Domain collection with ownership verification
- Keyword collection with search engine, locale, and device config
- Ranking history as MongoDB Time-Series Collection
- SEO audit results with flexible nested documents
- Backlink snapshots with quality scoring
- AI report collection storing generated insights

**Key Design Patterns:**
- **Compound indexes** on `{ keywordId: 1, checkedAt: -1 }` for fast historical queries
- **TTL indexes** to auto-expire old data (e.g., 90 days for free tier)
- **Time-Series Collections** for ranking data (native MongoDB 7+ support)
- Embed small bounded data; reference large growing data

---

### 1.3 REST API Core Architecture

**Purpose:** Build a modular, versioned REST API serving all client interactions and background job triggers.

**Why Essential:** The API is the backbone connecting React frontend, AI services, worker processes, and external integrations.

**Core Functionalities:**
- Versioned endpoints (`/api/v1/...`)
- Modular route → controller → service → validation architecture
- Global error handling with structured `AppError` class
- Request validation using Zod schemas
- Pagination (cursor-based), sorting, and filtering
- API rate limiting per user tier
- Swagger auto-generated documentation

**Project Structure:**
```
server/
├── config/           # DB, Redis, constants
├── middleware/        # auth, validation, error-handler, rate-limiter
├── models/           # Mongoose schemas
├── modules/          # Feature modules (auth, websites, keywords, etc.)
│   └── [module]/     # routes, controller, service, validation
├── services/         # Shared (gemini, browserbase, email)
├── jobs/             # BullMQ queues, workers, processors
├── prompts/          # Handlebars AI prompt templates
├── utils/            # Logger, helpers, response formatter
└── server.js
```

---

### 1.6 🆕 Multi-Project/Workspace Management

**Purpose:** Allow users to organize tracked websites into separate projects or workspaces, each with its own keyword sets and team access.

**Why Essential:** Agencies and freelancers manage multiple client websites. Without project separation, data becomes unmanageable. Semrush and SE Ranking both provide this.

**Core Functionalities:**
- Create/rename/archive projects
- Assign websites and keywords to projects
- Team member invitation with role-based permissions (Owner, Editor, Viewer)
- Project-level analytics and reporting
- Switch between projects in the dashboard

---

## Phase 2: SEO Analysis Engine

### 2.1 Website SEO Analyzer Tool (On-Page Audit)

**Purpose:** Crawl and analyze any URL to produce a comprehensive on-page SEO health report.

**Why Essential:** Core value proposition — users need instant, actionable SEO insights without manually inspecting HTML.

**Core Functionalities:**
- URL input with validation and normalization
- HTML fetching (static via axios; JS-rendered via Browserbase fallback)
- Meta tag analysis (title, description, OG tags, canonical, robots)
- Heading hierarchy validation (H1-H6)
- Image audit (missing alt text, oversized images, format)
- Internal/external link analysis with broken link detection
- Keyword density and content length evaluation
- Mobile responsiveness check
- Overall SEO score (0-100) with severity-categorized issues

**Libraries:** `cheerio`, `axios`, Browserbase, `robots-parser`, `xml2js`

**Challenges:**

| Challenge | Solution |
|-----------|----------|
| JS-rendered SPAs return empty HTML | Detect minimal content, auto-fallback to Browserbase |
| Rate limiting by target sites | Polite crawling with delays; respect robots.txt |
| Large pages causing OOM | Stream parsing; 5MB size limit |

---

### 2.5 🆕 Site Crawler (Multi-Page Deep Crawl)

**Purpose:** Crawl an entire website (not just a single page) to find technical SEO issues across hundreds or thousands of pages.

**Why Essential:** Competitors like Screaming Frog, Ahrefs Site Audit, and Semrush all offer deep site crawling. A single-page analyzer misses site-wide issues like orphan pages, redirect chains, and internal link distribution.

**Core Functionalities:**
- Configurable crawl depth and page limits (free tier: 100 pages, pro: 10,000)
- Broken link detection (internal 404s, external dead links)
- Redirect chain mapping (301/302 chains, redirect loops)
- JavaScript rendering mode via Browserbase for SPA sites
- Orphan page detection (pages with no internal links)
- Duplicate content detection (similar title/meta/content)
- Crawl budget analysis (identify wasted crawl resources)
- Crawl comparison over time (diff between two crawl snapshots)
- Exportable crawl data (CSV/JSON)

**Implementation Approach:**
1. Use BullMQ to manage crawl jobs with progress tracking
2. Start from the root URL, extract all internal links recursively
3. Use a seen-URL set to avoid duplicate crawls
4. Store each page's audit data in MongoDB
5. Run post-crawl aggregation to identify site-wide patterns

**Libraries:** `cheerio`, Browserbase, `p-limit` (concurrency control), `normalize-url`

---

### 2.6 🆕 Structured Data / Schema Markup Validator

**Purpose:** Validate JSON-LD, Microdata, and RDFa structured data on pages and suggest improvements.

**Why Essential:** Schema markup directly impacts rich snippet eligibility and AI model parsing. Google's AI Overviews favor well-structured content.

**Core Functionalities:**
- Extract all schema markup from a page
- Validate against Google's structured data guidelines
- Check for required/recommended properties per schema type
- Suggest missing schema types (FAQ, HowTo, Product, Article)
- AI-generated schema markup code snippets via Gemini

---

### 2.7 🆕 Internal Link Structure Analysis

**Purpose:** Visualize and optimize how internal links distribute PageRank across the site.

**Why Essential:** Internal linking is one of the most impactful and underutilized SEO tactics. Ahrefs and Screaming Frog provide this as a premium feature.

**Core Functionalities:**
- Internal link count per page (inlinks/outlinks)
- Click depth analysis (pages more than 3 clicks from homepage)
- Orphan page detection
- Anchor text distribution analysis
- AI suggestions for internal linking improvements

---

## Phase 3: AI Intelligence Layer

### 3.1 Gemini AI Integration Service

**Purpose:** Centralized service layer for all Gemini AI interactions with structured output, prompt templating, and model selection.

**Why Essential:** Multiple features depend on AI. A centralized service prevents duplication and enables consistent error handling, rate limiting, and cost tracking.

**Core Functionalities:**
- Model selection per task (Flash for speed, Pro for depth)
- Dynamic prompt construction via Handlebars templates
- Structured JSON output with Zod validation
- Streaming responses for real-time report generation
- Token usage tracking and cost monitoring per user
- Retry logic with exponential backoff
- Response caching (LRU, 24-hour TTL)

**Code Pattern:**
```javascript
class GeminiService {
  async analyzeWithStructuredOutput(prompt, schema, useProModel = false) {
    const model = useProModel ? this.proModel : this.flashModel;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    return JSON.parse(result.response.text());
  }
}
```

---

### 3.2 AI SEO Report Generator

**Purpose:** Transform raw audit data into comprehensive, human-readable reports with prioritized action items.

**Why Essential:** Raw data is meaningless to non-technical users. AI converts it into prioritized, plain-English recommendations.

**Core Functionalities:**
- Full SEO health report with executive summary
- Issue categorization by priority (Critical / Warning / Info)
- Actionable fix suggestions with code snippets (schema markup, meta tags)
- Content optimization recommendations
- Technical SEO improvement roadmap
- PDF/HTML export
- Report history with diff comparison

---

### 3.4 🆕 AI Content Brief Generator

**Purpose:** Generate structured content briefs by analyzing top-ranking pages for a target keyword.

**Why Essential:** Surfer SEO and Frase charge $49-199/mo for this feature alone. It's the highest-value AI feature for content teams.

**Core Functionalities:**
- Analyze top 10 SERP results for target keyword
- Generate recommended H2/H3 heading structure
- Suggest semantic keywords and LSI terms
- Identify "People Also Ask" questions to answer
- Recommend word count, reading level, and content type
- Generate FAQ section suggestions
- Export brief as Markdown/PDF

**Implementation:**
1. Scrape top 10 results via Browserbase/SerpApi
2. Extract headings, content, and entities from each page
3. Feed aggregated data to Gemini Pro with content brief prompt template
4. Return structured brief validated through Zod schema

---

### 3.5 🆕 AI Content Optimization Scorer

**Purpose:** Score existing content against top-ranking pages and provide specific improvement suggestions.

**Why Essential:** This is what makes Surfer SEO and Clearscope worth $100+/mo. A real-time content score while editing is extremely valuable.

**Core Functionalities:**
- Content score (0-100) based on topical coverage
- Missing keyword/topic suggestions
- Heading structure recommendations
- Readability analysis
- E-E-A-T signal checking
- Real-time score updates as user edits content

---

### 3.6 🆕 AI-Powered Competitor Analysis

**Purpose:** Use AI to analyze competitor websites and generate strategic insights.

**Why Essential:** Understanding competitor strategies is fundamental to SEO. AI can identify patterns humans would miss.

**Core Functionalities:**
- Compare your site vs. 3-5 competitor sites
- Identify content gaps and opportunities
- Analyze competitor keyword strategies
- Backlink profile comparison summary
- AI-generated competitive strategy recommendations
- Strengths/weaknesses analysis per competitor

---

## Phase 4: Rank Tracking & Automation

### 4.1 Keyword Rank Monitoring System

**Purpose:** Track daily search engine rankings for user-defined keywords, storing historical data for trend analysis.

**Why Essential:** Rank tracking is the primary ongoing value driver. Users need to see if their SEO efforts move the needle.

**Core Functionalities:**
- Add/remove keywords linked to a domain
- Configure search engine, locale, device type (desktop/mobile)
- Daily automated rank checks via BullMQ scheduled jobs
- Store position, URL, snippet, and SERP features per check
- Historical ranking trend data (time-series)
- Rank change notifications (position gained/lost)
- Bulk keyword import via CSV
- Keyword grouping and tagging

**Implementation Flow:**
1. User adds keyword → API saves to MongoDB, creates BullMQ repeatable job
2. Worker creates Browserbase session, searches Google
3. Parse SERP with Stagehand `extract()`, find user's domain
4. Store to time-series collection
5. If position changed ±5, trigger alert

---

### 4.2 Browser Automation with Browserbase

**Purpose:** Cloud-managed headless browser infrastructure for reliable, scalable SERP scraping.

**Why Essential:** Self-hosted Puppeteer fails at scale due to IP blocks, CAPTCHAs, and anti-bot detection. Browserbase handles all of this.

**Core Functionalities:**
- Browser sessions via API with proxy rotation
- Multi-step workflows (search → scroll → extract)
- CAPTCHA solving integration
- Session recording for debugging
- Parallel session management
- Stagehand AI-driven element targeting

**Code Pattern:**
```javascript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
});
await stagehand.init();
await stagehand.page.goto(`https://www.google.com/search?q=${keyword}&num=100`);
const results = await stagehand.extract({
  instruction: "Extract all organic search results with position, title, URL, snippet",
  schema: rankingSchema,
});
```

---

### 4.7 🆕 SERP Feature Tracking

**Purpose:** Track which SERP features (featured snippets, AI Overviews, map packs, video carousels) your site wins or loses.

**Why Essential:** In 2026, SERP features capture 40%+ of clicks. Ahrefs and Semrush both track this extensively. Position #1 means less if an AI Overview sits above it.

**Core Functionalities:**
- Detect 10+ SERP feature types per keyword check
- Track feature ownership over time (did you gain/lose the featured snippet?)
- Alert when a competitor takes your featured snippet
- Dashboard showing SERP feature distribution

---

### 4.8 🆕 Local SEO Rank Tracking (Geo-Grid)

**Purpose:** Track keyword rankings at specific geographic coordinates, not just city-level.

**Why Essential:** Local businesses need to know how they rank in specific neighborhoods. BrightLocal and SE Ranking offer geo-grid heatmaps.

**Core Functionalities:**
- Define a geographic area (city center + radius)
- Check rankings at a grid of GPS coordinates
- Visualize results on a heatmap (react-leaflet)
- Track local pack (Google Maps) positions
- Compare local ranking patterns over time

---

### 4.9 🆕 AI Visibility / GEO Tracking

**Purpose:** Monitor how often your brand/website is cited in AI-generated answers (Google AI Overviews, ChatGPT, Perplexity).

**Why Essential:** This is the biggest shift in SEO since mobile-first indexing. AthenaHQ and Peec.AI are building entire businesses around this. In 2026, "ranking" includes AI citations.

**Core Functionalities:**
- Track brand mentions in Google AI Overviews via SERP scraping
- Monitor citation frequency across AI search engines
- Identify which queries trigger AI citations for your domain
- Compare AI visibility vs. competitors
- AI-specific content optimization suggestions

---

## Phase 5: Backlink Intelligence 🆕

### 5.1 Backlink Profile Monitor

**Purpose:** Track and analyze all backlinks pointing to your website with quality metrics.

**Why Essential:** Backlinks remain a top-3 Google ranking factor. Ahrefs built a $100M+ business primarily on backlink data.

**Core Functionalities:**
- Ingest backlink data via DataForSEO API
- Display referring domains, total backlinks, dofollow/nofollow ratio
- Domain authority / trust flow metrics per referring domain
- Anchor text distribution analysis
- New/lost backlink timeline
- Top linked pages on your site
- Referring domain country/TLD breakdown

**Libraries:** DataForSEO API, `axios`, `node-cron` (scheduled sync)

---

### 5.2 Toxic Link Detection & Disavow Generator

**Purpose:** Identify harmful backlinks and generate Google-formatted disavow files.

**Why Essential:** Toxic links can trigger algorithm penalties. Semrush's toxic link detector is one of their most-used features.

**Core Functionalities:**
- Score each backlink on a toxicity scale (0-100)
- Flag based on: spam score, link farm detection, anchor text patterns, sudden spikes
- Human-in-the-loop review (approve/reject before disavow)
- Generate `disavow.txt` formatted for Google Search Console
- Track disavow history

---

### 5.3 Competitor Backlink Gap Analysis

**Purpose:** Find sites that link to competitors but not to you — immediate outreach opportunities.

**Core Functionalities:**
- Compare backlink profiles of up to 5 domains
- Identify "link gap" referring domains
- Sort by domain authority, relevance, and link type
- Export opportunity list for outreach campaigns

---

## Phase 6: Keyword Research & Content Strategy 🆕

### 6.1 Keyword Research & Discovery Tool

**Purpose:** Discover new keyword opportunities with volume, difficulty, and intent data.

**Why Essential:** This is table stakes for any SEO platform. Users need to find the right keywords before tracking them.

**Core Functionalities:**
- Seed keyword → related keyword suggestions
- Search volume, keyword difficulty, CPC data
- Search intent classification (informational, commercial, transactional, navigational)
- SERP overview for each keyword
- Keyword filtering and sorting
- Save keywords to tracking lists

**Data Source:** SerpApi keyword research endpoints or DataForSEO keyword data API

---

### 6.2 Keyword Gap Analysis

**Purpose:** Compare your keyword rankings against competitors to find opportunities.

**Core Functionalities:**
- Input your domain + up to 5 competitor domains
- Identify keywords where competitors rank but you don't
- Categorize: missing, weak (you rank lower), strong (you rank higher)
- Filter by volume, difficulty, and intent
- AI-generated prioritization recommendations

---

### 6.3 Topic Cluster & Content Pillar Planner

**Purpose:** Organize keywords into semantic topic clusters with pillar/spoke content architecture.

**Why Essential:** Topic clusters are the modern approach to SEO content strategy. MarketMuse and Surfer SEO charge premium prices for this.

**Core Functionalities:**
- Group keywords by semantic similarity using Gemini AI
- Identify pillar topics and supporting subtopics
- Suggest internal linking structure between cluster pages
- Track cluster coverage (% of subtopics with published content)
- Visual cluster map

---

### 6.4 Share of Voice / Visibility Score Dashboard

**Purpose:** Quantify your brand's overall search presence relative to competitors.

**Why Essential:** Individual keyword positions don't tell the full story. SOV is a leading indicator of organic traffic growth.

**Core Functionalities:**
- Calculate visibility score: `Σ(Search Volume × CTR at Position)` for all tracked keywords
- Share of Voice: your visibility ÷ total market visibility
- Track SOV trends over time
- Compare against competitors
- Breakdown by keyword group, device, and locale

**Calculation:**
```
Visibility Score = Σ (keyword_volume × estimated_ctr_at_position)
SOV (%) = (Your Visibility / Total Market Visibility) × 100
```

---

## Phase 7: Analytics, Reporting & Integrations

### 7.1 Ranking History Charts & Trends

**Core Functionalities:**
- Line charts (inverted Y-axis: #1 at top)
- Multi-keyword comparison on single chart
- Date range selection (7d, 30d, 90d, custom)
- Device/locale filters
- Rank change indicators (up/down with delta)
- SERP feature tracking overlay
- Exportable chart images

**Libraries:** `recharts`, `date-fns`, TanStack Query

---

### 7.5 🆕 White-Label Reporting (Agency Mode)

**Purpose:** Allow agencies to generate branded reports with their own logo, colors, and custom domain.

**Why Essential:** SE Ranking and BrightLocal make significant revenue from agency white-labeling. This is a major differentiator for agency adoption.

**Core Functionalities:**
- Custom logo and brand color upload
- White-label PDF reports (remove platform branding)
- Custom subdomain for client dashboards (CNAME setup)
- Client-specific read-only dashboard access
- Branded email delivery of scheduled reports
- Agency billing and client management

---

### 7.6 🆕 Google Analytics 4 Integration

**Purpose:** Correlate SEO rankings with actual traffic and conversion data from GA4.

**Why Essential:** Rankings without traffic context are incomplete. Users need to see: "Did that #1 ranking actually drive traffic and conversions?"

**Core Functionalities:**
- OAuth2 flow for GA4 connection
- Import organic traffic data per landing page
- Correlate ranking changes with traffic changes
- Conversion tracking overlay on ranking charts
- Bounce rate and engagement metrics per tracked keyword's landing page

---

### 7.7 🆕 Scheduled Automated Reports

**Purpose:** Automatically generate and email reports on a weekly/monthly schedule.

**Core Functionalities:**
- Configure report frequency (daily, weekly, monthly)
- Select report contents (rankings, audits, backlinks, AI insights)
- Multiple recipient email addresses
- PDF attachment or dashboard link
- BullMQ scheduled job for generation

---

## Phase 8: Deployment & Production

### 8.1-8.5 (See Part 3 for full DevOps details)

Key points:
- **Docker:** Multi-stage builds, separate API and Worker containers
- **CI/CD:** GitHub Actions with lint → test → build → deploy pipeline
- **Security:** Helmet, CORS whitelist, rate limiting, NoSQL injection prevention, Zod validation
- **Monitoring:** Sentry (errors), BetterStack (uptime), Bull Board (queues), Grafana (metrics)
- **Caching:** Redis for API responses (5-min TTL for dashboard), queue broker

---

> **Continue to Part 3:** [Implementation Guide & DevOps](./03-implementation-and-devops-guide.md)
