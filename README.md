---
title: SHL Assessment Recommender
emoji: 🎯
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
---

SHL Assessment Recommender
===

A full-stack conversational AI agent that recommends SHL assessments through dialogue. Built for the SHL Labs AI Intern take-home assessment.

## Architecture

```
frontend/          React + TypeScript + Vite + Tailwind
  src/
    pages/         HeroPage (landing) + ChatPage (conversation)
    components/    Reusable UI components
    styles/        Global CSS with liquid-glass utilities
    api.ts         HTTP client for backend
    types.ts       TypeScript interfaces

backend/
  main.py          FastAPI application + agent logic
  catalog.json     148 SHL Individual Test Solutions
  requirements.txt Python dependencies
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GROQ\_API\_KEY (free at console.groq.com)
python main.py
# Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

The Vite dev server proxies `/api/\*` to `http://localhost:8000`.

## API

### GET /health

```json
{ "status": "ok" }
```

### POST /chat

**Request:**

```json
{
  "messages": \[
    { "role": "user", "content": "I'm hiring a Java developer, mid-level, 4 years experience" }
  ]
}
```

**Response:**

```json
{
  "reply": "Here are 6 assessments that fit a mid-level Java developer...",
  "recommendations": \[
    { "name": "Java 8 (New)", "url": "https://www.shl.com/...", "test\_type": "K" },
    { "name": "Core Java (Advanced Level) (New)", "url": "https://www.shl.com/...", "test\_type": "K" }
  ],
  "end\_of\_conversation": false
}
```

**Schema guarantees:**

* `recommendations` is always an array (empty when clarifying, 1–10 items when recommending)
* All URLs come from the SHL catalog — no hallucinations
* `end\_of\_conversation: true` only when user signals completion
* Max 8 turns per conversation enforced

## Agent Behaviors

|Scenario|Agent behavior|
|-|-|
|Vague query ("I need an assessment")|Asks clarifying questions|
|Role + context provided|Recommends 1–10 catalog items|
|Mid-conversation refinement|Updates shortlist, doesn't restart|
|Comparison request|Answers from catalog data only|
|Off-topic / legal / competitor|Politely refuses|
|Prompt injection|Stays in scope|

## Deployment

### Render (Backend)

1. Push to GitHub
2. New Web Service → select repo
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add `ANTHROPIC\_API\_KEY` environment variable

### Vercel (Frontend)

1. Set `VITE\_API\_URL=https://your-render-url.onrender.com` in Vercel environment variables
2. Build: `npm run build`, Output: `dist`

## Environment Variables

|Variable|Required|Description|
|-|-|-|
|`GROQ\_API\_KEY`|Yes|Groq API key (backend) — free at console.groq.com|
|`VITE\_API\_URL`|No|Backend URL (defaults to `/api` proxy in dev)|

## Test Cases

Run these to verify agent behavior:

```bash
# Health check
curl https://your-api/health

# Vague query → should clarify
curl -X POST https://your-api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"messages":\[{"role":"user","content":"I need an assessment"}]}'

# Should clarify, NOT recommend on first turn

# Specific query → should recommend
curl -X POST https://your-api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"messages":\[{"role":"user","content":"Hiring a mid-level Python data scientist, 3 years experience, needs to present findings to non-technical stakeholders"}]}'

# Off-topic → should refuse
curl -X POST https://your-api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"messages":\[{"role":"user","content":"What is the legal age to hire in California?"}]}'
```

