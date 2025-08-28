# AI Intel App (Next.js + Node.js + MongoDB + Tailwind + LangChain)

One-click pipeline: **News + 1m/5m/15m candles** → **Excel** → **AI Analysis** with secure Email OTP authentication.

## Features

- **AI Analysis Pipeline**:
  - Fetches financial news and candle data
  - Generates Excel reports
  - AI-powered analysis using LangChain and OpenAI
- **Secure Authentication**:
  - Email OTP verification
  - JWT-based session management
  - Protected API routes

## Quickstart

1. **Installation**

```bash
pnpm i   # or npm i / yarn
```

2. **Environment Setup**

```bash
cp .env.example .env
```

3. **Configure Environment Variables**

```env
# MongoDB
MONGODB_URI=your_mongodb_uri

# OpenAI
OPENAI_API_KEY=your_openai_key

# Authentication
JWT_SECRET=your_jwt_secret_key
POSTMARK_API_KEY=your_postmark_api_key
POSTMARK_FROM_EMAIL=your_verified_sender@domain.com
```

4. **Start Development Server**

```bash
pnpm dev
```

5. **Access the Application**

- Open http://localhost:3000
- Sign in using email OTP authentication
- Start analyzing financial data

## Technical Notes

### Data Sources

- Uses Yahoo Finance (via `yahoo-finance2`) for intraday data (1m/5m/15m candles)
- News aggregation via DuckDuckGo HTML parsing (consider licensed APIs for production)
- Excel reports stored in `public/output/*.xlsx`, accessible through UI

### Authentication Flow

1. User enters email on login page
2. OTP is sent via Postmark
3. User verifies OTP
4. JWT token issued for session management
5. Protected routes accessible with valid JWT

### Security Features

- Email OTP verification prevents unauthorized access
- JWT tokens stored in HTTP-only cookies
- Edge-compatible middleware for route protection
- Rate limiting on authentication endpoints

### AI Integration

- LangChain (JS) orchestrates the analysis pipeline
- OpenAI provides intelligent financial insights
- Structured Excel output for easy data consumption

## Production Considerations

- The "TradingView" scraping is intentionally excluded (ToS compliance)
- Consider licensed news APIs for production use
- Implement proper rate limiting and error handling
- Use secure email service with production-grade delivery rates
