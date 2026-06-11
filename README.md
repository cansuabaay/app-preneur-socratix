# Socratix

**AI-Powered Corporate Innovation Management Platform**

Socratix is a local development MVP for corporate innovation teams. It is not production-deployed.

## Overview

Socratix helps companies transform employee ideas into validated innovations using AI.

Employees can:

- create ideas
- improve ideas with AI
- validate ideas before publishing
- collaborate with colleagues
- receive strategic AI insights

## Problem

Companies often lose valuable employee ideas because:

- ideas are scattered across tools
- employees lack feedback before submission
- managers cannot evaluate large numbers of ideas efficiently

## Solution

Socratix provides an AI-powered innovation lifecycle:

### 1. AI Enhancement

- improves draft ideas
- suggests structured improvements before submission

### 2. AI Validation

- asks feasibility, risk, and business questions before publishing
- stores validation responses on the idea
- helps employees strengthen ideas before they reach the innovation feed

### 3. AI Strategic Review

- analyzes submitted ideas using:
  - idea content
  - validation answers
  - accepted AI Enhancement suggestions
  - votes
  - discussions

Provides:

- impact potential
- risks
- strengths
- validation summary
- recommended next steps
- business value summary

## Key Features

### Authentication

- JWT login / register
- user profiles (department, job title, bio)
- avatar upload

### Innovation

- idea creation and management
- draft / submitted workflow with owner permissions
- innovation feed
- voting
- discussions / comments

### AI

- **AI Enhancement** — draft improvement suggestions
- **AI Validation** — pre-publish feasibility and risk review
- **AI Strategic Review** — post-submission executive-style analysis

### Collaboration

- Employee Directory (departments, roles, colleague discovery)
- employee-to-employee messaging

### Multilingual

- Turkish / English interface
- dynamic translation for ideas, AI content, and discussions (display only; database content unchanged)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI + Python |
| Database | PostgreSQL |
| AI | OpenAI / OpenRouter compatible APIs |
| Authentication | JWT |

## Project Structure

```
/frontend     React client application
/backend      FastAPI API, services, and database models
/prodocs      Product and technical documentation
/screenshots  UI screenshots for README and demos
```

## Environment Setup

Copy environment templates and add your local values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Configure at minimum:

- PostgreSQL connection in `backend/.env`
- `OPENAI_API_KEY` (or OpenRouter-compatible settings) for live AI responses

Never commit real secrets or `.env` files.

## Run Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

API docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (default Vite port)

## Documentation

Planning and delivery documentation is in `/prodocs`:

| Document | Description |
|---|---|
| [PRD](./prodocs/PRD.md) | Product requirements and user stories |
| [Plan](./prodocs/Plan.md) | Development plan and milestones |
| [Progress](./prodocs/Progress.md) | Implemented features and known limitations |
| [Design System](./prodocs/DesignSystem.md) | UI patterns and visual guidelines |
| [Tech Stack](./prodocs/tech-stack.md) | Architecture and technology decisions |

Additional root-level docs: [MVP scope](./MVP_Kapsam_Socratix.md), [Technical PRD](./TECH_PRD_Socratix.md), [Progress](./progress.md).

