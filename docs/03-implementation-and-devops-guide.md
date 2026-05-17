# Full Stack AI SEO Rank Tracker — Part 3: Implementation & DevOps Guide

> **Continued from:** [Part 2 — Feature Descriptions](./02-detailed-feature-descriptions.md)

---

## 1. Project Folder Structure

```
seo-rank-tracker/
├── .github/workflows/
│   ├── ci.yml                        # Lint + test on PRs
│   └── deploy.yml                    # Build + deploy on merge
├── client/                           # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Shadcn/Radix primitives
│   │   │   ├── charts/              # Recharts wrappers
│   │   │   ├── dashboard/           # KPI cards, widgets
│   │   │   ├── seo-audit/           # Audit result displays
│   │   │   ├── keywords/            # Keyword management UI
│   │   │   ├── rankings/            # Rank trend displays
│   │   │   ├── backlinks/           # Backlink profile UI 🆕
│   │   │   ├── content/             # Content brief editor 🆕
│   │   │   ├── crawler/             # Site crawl results 🆕
│   │   │   └── reports/             # AI report display + export
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/                      # Axios instance, utils
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx / Register.jsx
│   │   │   ├── SeoAnalyzer.jsx
│   │   │   ├── SiteCrawler.jsx       # 🆕
│   │   │   ├── Keywords.jsx
│   │   │   ├── KeywordResearch.jsx   # 🆕
│   │   │   ├── Rankings.jsx
│   │   │   ├── Backlinks.jsx         # 🆕
│   │   │   ├── ContentBrief.jsx      # 🆕
│   │   │   ├── Competitors.jsx       # 🆕
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   ├── store/                    # Zustand stores
│   │   └── styles/
│   ├── Dockerfile
│   └── vite.config.js
├── server/                           # Node.js Backend
│   ├── config/
│   │   ├── db.js                     # MongoDB connection
│   │   ├── redis.js                  # Redis connection
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Website.model.js
│   │   ├── Keyword.model.js
│   │   ├── Ranking.model.js
│   │   ├── AuditResult.model.js
│   │   ├── CrawlResult.model.js      # 🆕
│   │   ├── Backlink.model.js         # 🆕
│   │   ├── ContentBrief.model.js     # 🆕
│   │   └── AiReport.model.js
│   ├── modules/
│   │   ├── auth/                     # routes, controller, service, validation
│   │   ├── websites/
│   │   ├── keywords/
│   │   ├── rankings/
│   │   ├── seo-audit/
│   │   ├── site-crawler/             # 🆕
│   │   ├── backlinks/                # 🆕
│   │   ├── content/                  # 🆕
│   │   ├── competitors/              # 🆕
│   │   └── ai-reports/
│   ├── services/
│   │   ├── gemini.service.js
│   │   ├── browserbase.service.js
│   │   ├── serpApi.service.js
│   │   ├── dataForSeo.service.js     # 🆕 Backlink data
│   │   ├── gsc.service.js
│   │   ├── ga4.service.js            # 🆕 Google Analytics
│   │   ├── lighthouse.service.js
│   │   └── email.service.js
│   ├── jobs/
│   │   ├── queues.js
│   │   ├── worker.js
│   │   └── processors/
│   │       ├── rankCheck.processor.js
│   │       ├── seoAudit.processor.js
│   │       ├── siteCrawl.processor.js # 🆕
│   │       ├── backlinkSync.processor.js # 🆕
│   │       └── aiReport.processor.js
│   ├── prompts/                      # Handlebars prompt templates
│   │   ├── seo-report.hbs
│   │   ├── content-brief.hbs         # 🆕
│   │   ├── content-analysis.hbs
│   │   ├── competitor-analysis.hbs
│   │   └── topic-cluster.hbs         # 🆕
│   ├── utils/
│   │   ├── logger.js
│   │   ├── AppError.js
│   │   └── responseHelper.js
│   ├── Dockerfile
│   └── server.js
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## 2. MongoDB Schema Designs

### User Model
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  subscription: {
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    keywordLimit: { type: Number, default: 10 },
    websiteLimit: { type: Number, default: 2 },
    dailyAuditLimit: { type: Number, default: 5 },
    crawlPageLimit: { type: Number, default: 100 },
  },
  refreshTokens: [{ token: String, createdAt: Date, expiresAt: Date }],
  googleOAuth: { accessToken: String, refreshToken: String, connectedAt: Date },
  isEmailVerified: { type: Boolean, default: false },
  whiteLabel: { logo: String, brandColor: String, customDomain: String },
}, { timestamps: true });
```

### Keyword Model
```javascript
const keywordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true },
  keyword: { type: String, required: true, trim: true },
  searchEngine: { type: String, enum: ["google", "bing"], default: "google" },
  locale: { type: String, default: "us" },
  device: { type: String, enum: ["desktop", "mobile"], default: "desktop" },
  tags: [String],
  searchVolume: Number,
  keywordDifficulty: Number,
  searchIntent: { type: String, enum: ["informational", "commercial", "transactional", "navigational"] },
  currentPosition: Number,
  bestPosition: Number,
  lastCheckedAt: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

keywordSchema.index({ userId: 1, websiteId: 1 });
keywordSchema.index({ keyword: 1, locale: 1 });
```

### Ranking Model (Time-Series)
```javascript
const rankingSchema = new mongoose.Schema({
  checkedAt: { type: Date, required: true },
  metadata: {
    keywordId: { type: mongoose.Schema.Types.ObjectId, required: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  position: Number,
  previousPosition: Number,
  url: String,
  snippet: String,
  serpFeatures: [String], // ["featured_snippet", "ai_overview", "map_pack"]
  aiVisibility: { isCited: Boolean, citationContext: String },
  totalResults: Number,
  source: { type: String, enum: ["browserbase", "serpapi", "gsc"], default: "browserbase" },
});
// Created as Time-Series collection
```

### Backlink Model 🆕
```javascript
const backlinkSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true },
  sourceUrl: { type: String, required: true },
  targetUrl: { type: String, required: true },
  anchorText: String,
  linkType: { type: String, enum: ["dofollow", "nofollow", "ugc", "sponsored"] },
  domainAuthority: Number,
  spamScore: Number,
  toxicityScore: Number,
  isDisavowed: { type: Boolean, default: false },
  firstSeenAt: Date,
  lastSeenAt: Date,
  status: { type: String, enum: ["active", "lost", "broken"], default: "active" },
}, { timestamps: true });

backlinkSchema.index({ websiteId: 1, status: 1 });
backlinkSchema.index({ toxicityScore: -1 });
```

---

## 3. API Endpoint Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login, return tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |
| POST | `/api/v1/auth/forgot-password` | Send reset email |
| POST | `/api/v1/auth/reset-password/:token` | Reset password |
| GET | `/api/v1/auth/google` | Google OAuth redirect |

### Websites
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/websites` | Add website |
| GET | `/api/v1/websites` | List user's websites |
| DELETE | `/api/v1/websites/:id` | Remove website |

### SEO Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/audit` | Run single-page audit |
| GET | `/api/v1/audit/:id` | Get audit results |
| POST | `/api/v1/crawl` | Start multi-page crawl 🆕 |
| GET | `/api/v1/crawl/:id` | Get crawl results 🆕 |
| GET | `/api/v1/crawl/:id/pages` | List crawled pages 🆕 |

### Keywords
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/keywords` | Add keyword |
| GET | `/api/v1/keywords` | List tracked keywords |
| POST | `/api/v1/keywords/bulk` | Bulk import (CSV) |
| DELETE | `/api/v1/keywords/:id` | Remove keyword |
| POST | `/api/v1/keywords/:id/check` | On-demand rank check |
| GET | `/api/v1/keywords/research` | Keyword discovery 🆕 |
| GET | `/api/v1/keywords/gap` | Gap analysis 🆕 |

### Rankings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rankings/:keywordId` | Ranking history |
| GET | `/api/v1/rankings/dashboard` | Dashboard KPIs |
| GET | `/api/v1/rankings/sov` | Share of Voice 🆕 |
| GET | `/api/v1/rankings/export` | Export as CSV |

### Backlinks 🆕
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/backlinks/:websiteId` | Backlink profile |
| GET | `/api/v1/backlinks/:websiteId/toxic` | Toxic links |
| POST | `/api/v1/backlinks/:websiteId/disavow` | Generate disavow file |
| GET | `/api/v1/backlinks/:websiteId/gap` | Competitor link gap |
| POST | `/api/v1/backlinks/:websiteId/sync` | Trigger data refresh |

### Content 🆕
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/content/brief` | Generate content brief |
| POST | `/api/v1/content/score` | Score content |
| GET | `/api/v1/content/clusters/:websiteId` | Topic clusters |

### AI Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reports/generate` | Generate AI report |
| GET | `/api/v1/reports` | List reports |
| GET | `/api/v1/reports/:id` | Report details |
| GET | `/api/v1/reports/:id/pdf` | Download PDF |

### Competitors 🆕
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/competitors/analyze` | Run competitor analysis |
| GET | `/api/v1/competitors/:websiteId` | List tracked competitors |

---

## 4. Implementation Flow Diagrams

### 4.1 SEO Audit Flow
```mermaid
flowchart TD
    A["User enters URL"] --> B{"URL valid?"}
    B -->|No| C["Show validation error"]
    B -->|Yes| D["Check daily audit limit"]
    D -->|Exceeded| E["Show upgrade prompt"]
    D -->|OK| F["Enqueue audit job"]
    F --> G["Worker: Fetch page HTML"]
    G --> H{"JS-rendered?"}
    H -->|Static| I["Parse with Cheerio"]
    H -->|Dynamic| J["Fetch via Browserbase"]
    J --> I
    I --> K["Run 20+ SEO checks"]
    K --> L["Calculate SEO score"]
    L --> R["Store in MongoDB"]
    R --> S["Send to Gemini AI"]
    S --> T["Generate AI recommendations"]
    T --> U["Save report + notify user"]
```

### 4.2 Site Crawler Flow 🆕
```mermaid
flowchart TD
    A["User submits domain"] --> B["Create crawl job"]
    B --> C["Worker: Fetch robots.txt + sitemap"]
    C --> D["Start from homepage"]
    D --> E["Extract all internal links"]
    E --> F{"Page limit reached?"}
    F -->|No| G["Add new URLs to queue"]
    G --> H["Fetch next URL"]
    H --> I["Run per-page audit"]
    I --> E
    F -->|Yes| J["Run site-wide aggregation"]
    J --> K["Identify: broken links, redirects, orphans, duplicates"]
    K --> L["Calculate site health score"]
    L --> M["Store crawl snapshot"]
    M --> N["Notify user: Crawl complete"]
```

### 4.3 Backlink Sync Flow 🆕
```mermaid
flowchart TD
    A["Scheduled job or manual trigger"] --> B["Call DataForSEO Backlinks API"]
    B --> C["Fetch all backlinks for domain"]
    C --> D["Compare with existing data"]
    D --> E["Identify new backlinks"]
    D --> F["Identify lost backlinks"]
    D --> G["Run toxicity scoring"]
    E --> H["Store + alert user"]
    F --> H
    G --> H
    H --> I["Update dashboard metrics"]
```

---

## 5. Environment Variables

```bash
# .env.example

# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seo-tracker

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Browserbase
BROWSERBASE_API_KEY=your-api-key
BROWSERBASE_PROJECT_ID=your-project-id

# SerpApi (Fallback)
SERPAPI_KEY=your-serpapi-key

# DataForSEO (Backlinks) 🆕
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password

# Google OAuth
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# Google Search Console
GSC_SERVICE_ACCOUNT_EMAIL=sa@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY=your-key

# Google Analytics 4 🆕
GA4_PROPERTY_ID=your-property-id

# Email (Resend)
RESEND_API_KEY=your-key
EMAIL_FROM=noreply@yourdomain.com

# Sentry
SENTRY_DSN=https://your-sentry-dsn
```

---

## 6. Deployment Architecture

```mermaid
graph TB
    subgraph "CDN / Edge"
        CF["Cloudflare DNS + CDN"]
    end
    subgraph "Frontend"
        FE["Vercel - React SPA"]
    end
    subgraph "Backend"
        API["Railway - API Server"]
        WK["Railway - Worker Process"]
    end
    subgraph "Managed Services"
        MA["MongoDB Atlas"]
        RD["Upstash Redis"]
        BB["Browserbase"]
        GM["Gemini AI API"]
        DF["DataForSEO API"]
        SE["Sentry"]
    end

    CF --> FE
    CF --> API
    FE -->|API calls| API
    API --> MA
    API --> RD
    WK --> MA
    WK --> RD
    WK --> BB
    WK --> GM
    WK --> DF
    API --> SE
```

### Production Dockerfile (Multi-Stage)
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
USER nodeuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5000/health || exit 1
CMD ["node", "server.js"]
```

### Docker Compose (Development)
```yaml
services:
  api:
    build: ./server
    ports: ["5000:5000"]
    depends_on: [mongo, redis]
    env_file: .env
    volumes: ["./server:/app", "/app/node_modules"]

  worker:
    build: ./server
    command: node jobs/worker.js
    depends_on: [mongo, redis]
    env_file: .env

  client:
    build: ./client
    ports: ["3000:3000"]
    volumes: ["./client:/app", "/app/node_modules"]

  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo-data:/data/db"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  mongo-data:
```

---

## 7. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd server && npm ci && npm test
      - run: cd client && npm ci && npm test

  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t ghcr.io/${{ github.repository }}/api:${{ github.sha }} ./server
      - name: Deploy to Railway
        run: railway up --service api
```

---

## 8. Security Checklist

- [ ] Access tokens short-lived (15 min), stored in-memory only
- [ ] Refresh tokens in HttpOnly/Secure/SameSite cookies
- [ ] Refresh token rotation (one-time use)
- [ ] All inputs validated with Zod
- [ ] Rate limiting on all endpoints (stricter on auth)
- [ ] Helmet security headers enabled
- [ ] CORS whitelist (no wildcards in production)
- [ ] NoSQL injection prevention (express-mongo-sanitize)
- [ ] HTTPS enforced everywhere
- [ ] Docker containers run as non-root
- [ ] Secrets in env vars, never in code
- [ ] API keys scoped with minimal permissions

---

## 9. Cost Estimation

| Service | Free Tier | Production (~$) |
|---------|-----------|-----------------|
| MongoDB Atlas | M0 (512MB) | M10: ~$57/mo |
| Upstash Redis | 10K cmds/day | Pro: ~$10/mo |
| Browserbase | 100 sessions/mo | Growth: ~$49/mo |
| Gemini AI | Free (rate limited) | ~$20-50/mo |
| SerpApi | 100 searches/mo | ~$50/mo |
| DataForSEO | Pay-as-you-go | ~$30-60/mo |
| Vercel | Hobby (free) | Pro: $20/mo |
| Railway | Free tier | Starter: ~$10/mo |
| Sentry | 5K errors/mo | Team: $26/mo |
| Resend | 3K emails/mo | Pro: $20/mo |
| **Total** | — | **~$300-400/mo** |

---

## 10. Scalability Roadmap

| Scale | Users | Architecture |
|-------|-------|-------------|
| **MVP** | 1-100 | Single API + Worker on Railway |
| **Growth** | 100-1K | Separate containers; Redis caching; read replicas |
| **Scale** | 1K-10K | Kubernetes with HPA; multiple workers; CDN for API |
| **Enterprise** | 10K+ | Microservices; dedicated scraping cluster |

---

## 11. Feature Comparison vs. Competitors

| Feature | Our Platform | Ahrefs | Semrush | SE Ranking |
|---------|:---:|:---:|:---:|:---:|
| Keyword Rank Tracking | ✅ | ✅ | ✅ | ✅ |
| Site SEO Audit | ✅ | ✅ | ✅ | ✅ |
| Multi-Page Site Crawler | ✅ | ✅ | ✅ | ✅ |
| AI SEO Reports | ✅ | ❌ | ✅ | ❌ |
| AI Content Briefs | ✅ | ❌ | ✅ | ❌ |
| AI Visibility / GEO Tracking | ✅ | ✅ | ✅ | ✅ |
| Backlink Monitor | ✅ | ✅ | ✅ | ✅ |
| Toxic Link Detection | ✅ | ❌ | ✅ | ✅ |
| Keyword Research | ✅ | ✅ | ✅ | ✅ |
| Content Optimization Scorer | ✅ | ❌ | ❌ | ❌ |
| Share of Voice | ✅ | ❌ | ✅ | ✅ |
| Local SEO Geo-Grid | ✅ | ❌ | ❌ | ✅ |
| White-Label Reports | ✅ | ❌ | ❌ | ✅ |
| GA4 Integration | ✅ | ❌ | ✅ | ✅ |
| Open Source / Self-Hosted | ✅ | ❌ | ❌ | ❌ |
| **Pricing** | **Free + $29-99** | **$99-999** | **$139-499** | **$65-239** |

---

> **End of Report**  
> Total Features: **42** across **8 development phases**  
> New features from competitor analysis: **18**  
> Estimated Timeline: **24-26 weeks** (solo developer)  
> Tech Stack: **60+ technologies** across 7 categories
