# AI Intel App

## 🏗️ Architecture Overview

A microservices-based financial analysis platform combining real-time market data, news aggregation, and AI-powered insights.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │────│  Python Service │────│   Redis Cache   │
│   (Port 3000)  │    │   (Port 8000)   │    │   (Port 6379)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│   MongoDB       │──────────────┘
                        │  (User & Data)  │
                        └─────────────────┘
                                 │
                   ┌─────────────────────────────┐
                   │     External APIs           │
                   │  • NewsAPI (News Feed)      │
                   │  • Yahoo Finance (OHLCV)    │
                   │  • OpenAI (AI Analysis)     │
                   │  • SendGrid (Email OTP)     │
                   └─────────────────────────────┘
```

## 🎯 Features

### 📊 **Financial Data Pipeline**
- **Multi-timeframe Analysis**: 15m, 1h, 1d candle data from Yahoo Finance
- **News Integration**: Real-time news feed via NewsAPI
- **Excel Report Generation**: Automated XLSX reports with structured data
- **Technical Analysis**: EMA, RSI, MACD indicators via Python service

### 🔒 **Authentication & Security**
- **Email OTP Authentication**: Secure passwordless login
- **JWT Session Management**: HTTP-only cookies with expiration
- **Rate Limiting**: API protection with Redis-based limiting
- **Protected Routes**: Middleware-based route protection

### 🤖 **AI-Powered Analysis**
- **LangChain Integration**: Orchestrated AI analysis pipeline
- **OpenAI GPT Analysis**: Intelligent market insights
- **Python Analytics Service**: Technical indicator calculations
- **Structured Output**: JSON-formatted analysis results

## 🚀 Quickstart

### **Prerequisites**
- Node.js 18+ 
- Docker & Docker Compose
- OpenAI API Key
- NewsAPI Key
- SendGrid Account

### **Authentication Endpoints**
- `POST /api/auth/request-otp` - Request OTP for email
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/validate-token` - Validate current session

### **Core Services**
- `POST /api/run` - Execute full analysis pipeline
- `GET /api/companies` - Get available companies/tickers
- `GET /api/download` - Download generated Excel reports
- `GET /api/search-history` - User's analysis history

### **Python Analysis Service** (Port 8000)
- `GET /health` - Service health check
- `POST /analyze` - Technical analysis with indicators
  ```json
  {
    "company": "apple",
    "ticker": "AAPL"
  }
  ```

## 🔧 Technology Stack

### **Frontend & Backend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Middleware** - Edge-compatible route protection

### **Data & AI**
- **LangChain** - AI orchestration framework
- **OpenAI GPT** - Natural language analysis
- **Yahoo Finance API** - Real-time market data
- **NewsAPI** - Financial news aggregation
- **ExcelJS** - Automated report generation

### **Infrastructure**
- **FastAPI** - Python microservice for analytics
- **MongoDB** - User data and session storage
- **Redis** - Caching and rate limiting
- **Docker Compose** - Container orchestration
- **SendGrid** - Email delivery service

### **Analytics Libraries**
- **TA-Lib** - Technical analysis indicators
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing

## 📈 Data Sources

### **Market Data (Yahoo Finance)**
- **Timeframes**: 15-minute, 1-hour, 1-day candles
- **OHLCV Data**: Open, High, Low, Close, Volume
- **Historical Range**: Up to 255 days for daily data
- **Real-time Updates**: Intraday data with minimal delay

### **News Feed (NewsAPI)**
- **Coverage**: Global financial news sources
- **Filtering**: Company-specific news queries
- **Recency**: Last 30 days of articles
- **Sorting**: Popularity and relevance based
- **Language**: English language articles

### **Technical Indicators**
- **EMA**: 20-period and 50-period Exponential Moving Averages
- **RSI**: Relative Strength Index (14-period)
- **MACD**: Moving Average Convergence Divergence
- **Sentiment Analysis**: Bullish/Bearish trend determination

1. **Installation**

```bash
pnpm i   # or npm i / yarn
```

2. **Environment Setup**

```bash
cp .env.example .env
```

### **Environment Configuration**

```env
# MongoDB Configuration
MONGO_USER=admin
MONGO_PASSWORD=your_secure_password
MONGO_DB=ai-intel-app

# API Keys
OPENAI_API_KEY=sk-...your_openai_api_key
NEWSAPI_KEY=your_newsapi_key

# Authentication
JWT_SECRET=your_random_secret_key
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_verified_email

# Service URLs (Docker)
MONGODB_URI=mongodb://admin:your_password@mongodb:27017/ai-intel-app
REDIS_URL=redis://redis:6379
PYTHON_ANALYSIS_URL=http://python-analysis:8000/analyze
```

### **Development Setup**

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start development server
pnpm dev
```

### **Production Deployment**

```bash
# 1. Build and start all services
docker-compose up -d

# 2. Verify services are running
docker-compose ps
docker-compose logs -f

# 3. Access the application
# http://localhost:3000 - Main App
# http://localhost:8000 - Python Analytics Service
```

## 🔐 Authentication Flow

```
1. User enters email address
2. OTP sent via SendGrid
3. User verifies 6-digit OTP
4. JWT token issued (HTTP-only cookie)
5. Protected routes accessible
6. Token expires after 24 hours
```

### **Security Features**
- **Rate Limiting**: 5 requests per minute per IP
- **OTP Expiration**: 10 minutes validity
- **Session Management**: Secure JWT with automatic refresh
- **CORS Protection**: Configured for production domains
- **Input Validation**: Zod schemas for all inputs

## 🔧 Technical Implementation

### **Microservices Architecture**

#### **Next.js Application (Port 3000)**
- **App Router**: File-based routing with server components
- **API Routes**: RESTful endpoints with rate limiting
- **Middleware**: Edge-compatible authentication checks
- **Static Generation**: Optimized builds with caching

#### **Python Analysis Service (Port 8000)**
- **FastAPI**: High-performance async Python web framework
- **Technical Analysis**: TA-Lib indicators (EMA, RSI, MACD)
- **Data Processing**: Pandas for Excel data manipulation
- **Health Checks**: Container health monitoring
- **Volume Mounting**: Shared file system with main app

#### **Redis Cache (Port 6379)**
- **Rate Limiting**: IP-based request throttling
- **Session Storage**: JWT blacklisting capability
- **Caching**: Temporary data storage for performance

### **Data Flow Pipeline**

```
1. User initiates analysis request
2. Next.js API fetches news (NewsAPI) + market data (Yahoo Finance)
3. Data compiled into Excel report (ExcelJS)
4. Excel file saved to shared volume
5. Python service processes technical indicators
6. LangChain orchestrates AI analysis
7. Combined results returned to user
8. Analysis stored in MongoDB for history
```

### **File Structure**
```
ai-intel-app/
├── app/                     # Next.js App Router
│   ├── api/                 # API endpoints
│   │   ├── auth/           # Authentication routes
│   │   ├── run/            # Analysis pipeline
│   │   └── companies/      # Company data
│   ├── components/         # React components
│   └── page.tsx           # Main dashboard
├── lib/                    # Shared utilities
│   ├── agents.js          # LangChain agents
│   ├── db/                # Database connections
│   └── rateLimit.js       # Rate limiting logic
├── models/                 # MongoDB schemas
├── python-analysis/        # Python microservice
│   ├── app.py             # FastAPI application
│   ├── Dockerfile         # Container definition
│   └── requirements.txt   # Python dependencies
├── public/output/          # Generated Excel reports
└── docker-compose.yml      # Service orchestration
```

## 🚨 Production Considerations

### **NewsAPI Integration**
- **Current**: NewsAPI free tier (1000 requests/day)
- **Production**: Consider premium tier or alternative news APIs
- **Rate Limits**: Built-in request throttling
- **Error Handling**: Graceful fallbacks for API failures

### **Security Hardening**
- **Environment Variables**: Use Docker secrets for sensitive data
- **HTTPS**: Configure SSL/TLS certificates
- **Reverse Proxy**: Nginx for load balancing and security
- **CORS**: Restrict origins for production domains
- **Input Validation**: Comprehensive Zod schemas

### **Scaling Considerations**
- **Database**: MongoDB replica sets for high availability
- **Caching**: Redis cluster for distributed caching
- **Load Balancing**: Multiple Next.js instances behind proxy
- **Analytics Service**: Horizontal scaling of Python containers
- **Monitoring**: Application performance monitoring (APM)

### **Compliance & Legal**
- **Data Privacy**: GDPR/CCPA compliance for user data
- **Financial Data**: Proper licensing for market data usage
- **Rate Limiting**: Respect API provider terms of service
- **Audit Logs**: Track all user activities and data access

## 📝 License

This project is for educational and development purposes. Ensure proper licensing for production use of financial data APIs.

---

**Built with ❤️ using Next.js, Python, and AI**
