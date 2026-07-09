# Lucid — Smart Portfolio Manager

AI-powered personal finance tracker with natural language expense entry, real investment holdings with live prices, zero-based budgeting, subscription detection, net worth history, and password recovery.

## Features

- **AI Agent Chat** — Add income, expenses, investments, goals, funds, and rules via natural language
- **Real Investment Holdings** — Track stocks/ETFs with live Yahoo Finance prices, allocation donut, gain/loss table
- **Expense Tracking** — Categorize, filter, and analyze spending with color-coded badges + source badges (AI / Manual / Import)
- **Income Tracking** — Record multiple income sources with frequency
- **Zero-Based Budgeting** — Assign every dollar to categories with envelope or zero-based modes
- **Subscription Detection** — Auto-detects recurring expenses from your history; promote to recurring transactions
- **Recurring Transactions** — Manage bills, subscriptions, and recurring income with upcoming view
- **Net Worth History** — Daily auto-snapshots, trend chart with 1m/3m/6m change deltas
- **Accounts & Net Worth** — Track assets vs liabilities with real-time net worth calculation
- **Investment Goals** — Set targets with projected timelines and monthly contribution tracking
- **Fund Tracking** — Separate savings/emergency/vacation funds with goal links
- **Spending Rules** — Define per-category limits and get alerts
- **CSV Bank Statement Import** — 3-step wizard with bank auto-detection (SBI, HDFC, ICICI, Axis, Kotak), duplicate prevention
- **Reports & Analysis** — AI-powered purchase analysis, investment assistant, Excel/PNG exports
- **Multi-Currency** — 20 currencies, switchable at any time
- **Dashboard Widgets** — Customizable layout with metric cards, charts, budget overview, loans, net worth history, AI suggestions
- **Password Reset** — Forgot/reset password flow with email (SMTP or console fallback)
- **HelpBot** — In-app AI assistant floating widget with quick actions and knowledge base

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.9, FastAPI, SQLAlchemy, SQLite |
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4 |
| AI | Google Gemini API (free tier) with regex fallback |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Charts | Recharts (frontend), Matplotlib (backend exports) |
| Design | Glassmorphism, dark theme, framer-motion animations |

## Architecture

```
lucid/
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── main.py           # Entry point, router registration
│   │   ├── config.py         # Settings (env vars)
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models/           # DB models (User, Expense, Income, etc.)
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic (AI, reports)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── utils/            # Auth helpers
│   └── requirements.txt
├── frontend/           # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI (GlassCard, Layout, icons, etc.)
│   │   ├── hooks/            # useAuth, useCurrency
│   │   ├── pages/            # 20 route pages
│   │   ├── services/         # API client (axios)
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # formatAmount, colors
│   └── package.json
└── run.sh              # Starts both servers
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_random_secret_key

# Optional — for password reset emails
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM_EMAIL=your_verified_sender@example.com
```

*Without a Gemini API key, AI features fall back to regex-based parsing — core functionality still works.*
*Without SMTP, password reset links are printed to the backend console.*

### Frontend Setup

```bash
cd frontend
npm install
```

### Run

```bash
chmod +x run.sh
./run.sh
```

Or start separately:

```bash
# Terminal 1 — Backend (http://localhost:8000)
cd backend && source venv/bin/activate && uvicorn app.main:app --port 8000 --reload

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npx vite
```

## AI Agent

The unified AI agent endpoint (`POST /api/ai/agent`) handles 9 intents via natural language.

### Supported Intents

| Intent | Example | What it does |
|--------|---------|--------------|
| `add_income` | "I got paid $5000 this month" | Creates income record |
| `add_expense` | "Spent $45 on groceries at Walmart" | Creates expense with merchant |
| `add_investment_goal` | "I want to save $50k for retirement" | Creates investment goal |
| `add_investment` | "I'm investing $500/month" | Updates or creates investment goal + optionally logs expense |
| `add_savings_goal` | "I want to save $10k this year" | Creates savings goal |
| `add_to_fund` | "Add $100 to my emergency fund" | Creates or contributes to a fund |
| `add_spending_rule` | "Limit eating out to $200/month" | Creates spending rule |
| `change_currency` | "Switch to EUR" | Updates user currency |
| `general` | "How are my finances looking?" | Returns contextual summary |

### Try It

Go to **Chat** (`/chat`) or click **Try the Agent** in the Welcome Popup, then type something like:

- "I spent $65 on dinner at Olive Garden"
- "Set a $300 monthly limit on Shopping"
- "I'm investing $1000 a month into ETFs"

## Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Metrics, charts, quick expense entry, budget overview, loans, net worth history, AI suggestions |
| Assistant | `/chat` | Full-screen AI agent chat |
| Expenses | `/expenses` | CRUD with category filters, source badges, import button |
| Budget | `/budget` | Envelope / zero-based budgeting with month navigation |
| Subscriptions | `/subscriptions` | Detected subscriptions with dismiss / promote to recurring |
| Recurring | `/recurring` | Manage bills, subscriptions, recurring income with upcoming view |
| Rules | `/rules` | Spending rule CRUD with AI suggestions |
| Portfolio | `/portfolio` | Holdings table, allocation donut, live prices, gain/loss |
| Investments | `/goals` | Investment & savings goals, fund tracking, timeline calculator |
| Accounts | `/accounts` | Asset & liability tracking with net worth |
| Analyze | `/analyze` | AI purchase analysis + investment assistant |
| Reports | `/reports` | Excel/PNG report generation |
| Import | `/import` | 3-step CSV wizard with bank auto-detection and duplicate prevention |
| Account | `/account` | Profile, currency, password settings |
| Help | `/help` | Quick start guide and FAQ |

## API Endpoints

| Group | Prefix | Key Endpoints |
|-------|--------|---------------|
| Auth | `/api/auth` | signup, login, me, update-currency, forgot-password, reset-password |
| Expenses | `/api/expenses` | CRUD + stats + classify |
| Income | `/api/income` | CRUD |
| Rules | `/api/rules` | CRUD + suggestions |
| Goals | `/api/goals` | CRUD + calculate-timeline |
| Budgets | `/api/budgets` | CRUD + current + assign |
| Subscriptions | `/api/subscriptions` | detect, promote |
| Accounts | `/api/accounts` | CRUD + net-worth + snapshot + history |
| Holdings | `/api/holdings` | CRUD + portfolio (live prices) |
| Funds | `/api/funds` | CRUD |
| Recurring | `/api/recurring` | CRUD + upcoming |
| Imports | `/api/imports` | upload (preview), confirm, history, delete |
| AI | `/api/ai` | suggest, analyze, investment-assistant, agent, rules-suggestions |
| Reports | `/api/reports` | export-excel, export-chart |
| Health | `/api/health` | Health check |

## Multi-Currency

20 currencies supported (USD, EUR, GBP, JPY, INR, CAD, AUD, etc.). Select at signup or change anytime in **Account** settings. Currency propagates globally — all amounts display in your chosen currency with the correct symbol.

## Development

```bash
# Frontend lint
cd frontend && npm run lint

# Frontend build
cd frontend && npm run build

# API docs (when running)
open http://localhost:8000/docs
```

## License

MIT
