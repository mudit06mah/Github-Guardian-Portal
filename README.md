# GitHub Guardian - CI/CD Security Monitoring Portal

![GitHub Guardian](https://img.shields.io/badge/GitHub-Guardian-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## Overview

GitHub Guardian is an enterprise-grade security monitoring platform for GitHub CI/CD workflows. It automatically scans GitHub Actions workflows for security vulnerabilities, provides incident tracking, and enables safe code execution in isolated sandboxes.

### Key Features

✨ **Security Scanning**
- Detects unpinned GitHub Actions
- Identifies curl/bash injection patterns
- Finds hardcoded secrets
- Flags external script downloads
- Detects shell injection vulnerabilities

🛡️ **Incident Management**
- Centralized incident dashboard
- Real-time incident tracking
- Severity classification (High, Medium, Low, Ambiguous)
- Status management (Open, Fixed, Dismissed)

🔬 **Sandbox Orchestration**
- Safe code execution in isolated containers
- Snippet analysis and verdict generation
- Runtime log capture
- Docker-based security isolation

📊 **Analytics Dashboard**
- Real-time security metrics
- Incident statistics
- Workflow monitoring
- Safe/unsafe sandbox run tracking

🔐 **GitHub Integration**
- Webhook support for real-time updates
- Direct GitHub API integration
- Workflow file analysis
- Pull request monitoring

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Or: Python 3.11+, Node.js 18+, PostgreSQL 15+
- GitHub Personal Access Token

### Option 1: Docker Compose (Recommended)

\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/github-guardian.git
cd github-guardian

# Configure environment
cp .env.example .env
# Edit .env & add your GitHub API token

# Start services
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
\`\`\`

### Option 2: Manual Setup

**Backend:**
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
\`\`\`

**Frontend:**
\`\`\`bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
\`\`\`

## Usage

### 1. Login/Register
- Visit http://localhost:3000/login
- Enter email, GitHub username, and personal access token
- Token is used for GitHub API access

### 2. Add Repositories
- Click "Add New Repository"
- Enter `owner/repository-name`
- Guardian automatically scans workflows

### 3. View Incidents
- Dashboard shows real-time security metrics
- Click incidents to view details
- Review workflow violations

### 4. Execute Sandboxes
- Open incident details
- Execute code snippets in isolated sandbox
- View execution verdict and logs
- Determine if code is safe or unsafe

### 5. Manage Status
- Update incident status (Open, Fixed, Dismissed)
- Track remediation progress
- Generate security reports

## Architecture

\`\`\`
┌─────────────────────────────────────────────────────┐
│                  GitHub Guardian                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐              ┌──────────────┐   │
│  │  Frontend    │              │   Backend    │   │
│  │  (Next.js)   │◄────────────►│ (FastAPI)    │   │
│  │              │              │              │   │
│  └──────────────┘              └──────────────┘   │
│       │                              │              │
│       │                    ┌─────────┼─────────┐   │
│       │                    │         │         │   │
│       └───────────────────►│         │         │   │
│                       ┌────▼──┬──────▼──┬─────▼──┐ │
│                       │GitHub │Database │Docker  │ │
│                       │ API   │(Postgres)│Engine │ │
│                       └───────┴─────────┴────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
\`\`\`

## Technology Stack

**Backend:**
- FastAPI - Modern async Python web framework
- SQLAlchemy - ORM for database operations
- PostgreSQL - Persistent data storage
- httpx - Async HTTP client for GitHub API
- Docker - Container isolation for code execution

**Frontend:**
- Next.js 16 - React framework with App Router
- TypeScript - Type-safe JavaScript
- Tailwind CSS v4 - Utility-first CSS
- Lucide React - Icon library
- shadcn/ui - Component library

**Infrastructure:**
- Docker & Docker Compose - Container orchestration
- PostgreSQL 15 - Database
- Uvicorn - ASGI server

## API Documentation

### Authentication

\`\`\`bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "github_username": "username",
  "api_token": "ghp_..."
}

# Response
{
  "access_token": "token...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "github_username": "username",
    "email": "user@example.com"
  }
}
\`\`\`

### Repositories

\`\`\`bash
# List repositories
GET /api/repos?user_id={user_id}

# Add repository
POST /api/repos?user_id={user_id}
{
  "full_name": "owner/repo"
}

# Delete repository
DELETE /api/repos/{repo_id}
\`\`\`

### Incidents

\`\`\`bash
# Dashboard stats
GET /api/incidents/dashboard?user_id={user_id}

# List incidents
GET /api/incidents?user_id={user_id}

# Get incident
GET /api/incidents/{incident_id}

# Update status
PUT /api/incidents/{incident_id}/status
{
  "status": "Fixed"
}
\`\`\`

### Sandbox

\`\`\`bash
# Execute snippet
POST /api/sandbox/{incident_id}
{
  "snippet_executed": "print('Hello')",
  "verdict": "Unknown"
}

# Get result
GET /api/sandbox/{incident_id}
\`\`\`

See http://localhost:8000/docs for interactive API documentation.

## Configuration

### Environment Variables

**Backend (.env):**
\`\`\`bash
DATABASE_URL=postgresql://user:password@host/dbname
GITHUB_API_TOKEN=ghp_your_token_here
GITHUB_WEBHOOK_SECRET=webhook_secret_here
CORS_ORIGINS=http://localhost:3000
\`\`\`

**Frontend (.env.local):**
\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
\`\`\`

### GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`, `read:user`
4. Copy token to `.env`

## Deployment

### Railway.app (Recommended)

\`\`\`bash
# Deploy repository to Railway
# Railway auto-detects and deploys

# Configure environment variables in Railway dashboard
# Set DATABASE_URL, GITHUB_API_TOKEN, etc.
\`\`\`

### Vercel (Frontend)

\`\`\`bash
cd frontend
vercel
# Configure NEXT_PUBLIC_API_URL to production backend
\`\`\`

### Docker Compose (VPS/Self-Hosted)

\`\`\`bash
docker-compose -f docker-compose.yml up -d
\`\`\`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

\`\`\`
github-guardian/
├── backend/                    # FastAPI backend
│   ├── services/              # Business logic
│   ├── routes/                # API endpoints
│   ├── models.py              # Database models
│   ├── schemas.py             # Request/response schemas
│   └── main.py                # App entry point
├── frontend/                  # Next.js frontend
│   ├── app/                   # Pages and layouts
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   └── package.json
├── docker-compose.yml         # Container orchestration
└── README.md                  # This file
\`\`\`

See [MONOREPO_STRUCTURE.md](./MONOREPO_STRUCTURE.md) for detailed structure.

## Development

### Code Style

**Backend:**
- Follow PEP 8
- Use type hints
- Add docstrings to functions

**Frontend:**
- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling

### Running Tests

**Backend:**
\`\`\`bash
pytest
\`\`\`

**Frontend:**
\`\`\`bash
npm test
\`\`\`

### Database Migrations

Database schema is automatically created on backend startup. For manual migrations:

\`\`\`bash
# Connect to database
psql $DATABASE_URL


## Troubleshooting

### Can't login
- Verify GitHub API token is valid
- Check token has correct scopes: `repo`, `workflow`, `read:user`
- Try generating a new token

### Backend returns 500 error
- Check backend logs: `docker-compose logs -f backend`
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running

### Frontend shows "Failed to fetch"
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running on correct port
- Verify CORS settings allow frontend origin

### Webhook not triggering
- Ensure webhook URL is publicly accessible
- Verify webhook secret matches
- Check GitHub webhook delivery logs

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for common issues

## Roadmap

- [ ] OAuth authentication with GitHub
- [ ] Email notifications for critical incidents
- [ ] Slack integration
- [ ] Custom security rules
- [ ] Historical trends and reporting
- [ ] Multi-user organization support
- [ ] API rate limiting
- [ ] Redis caching layer
- [ ] Mobile app

## Security Notice

This tool is designed for security analysis. Always:
- Review findings carefully
- Test fixes in staging first
- Keep GitHub tokens secure
- Use strong webhook secrets
- Enable HTTPS in production
