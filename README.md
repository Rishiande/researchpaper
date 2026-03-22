# Research Paper Organizer

A full-stack cloud-based web application for managing, organizing, and annotating academic research papers. Built with **FastAPI**, **React**, **PostgreSQL**, and a custom Python library (`researchpaperlib`).

---

## Features

- **Paper Management** — Full CRUD operations for research papers
- **DOI Resolution** — Automatic metadata retrieval from CrossRef and DataCite APIs
- **Citation Generation** — APA, IEEE, and BibTeX citation formats
- **PDF Upload & Storage** — Upload and manage research paper PDFs
- **Note-Taking** — Create, edit, and delete notes per paper
- **Search & Filter** — Search by title, author, keywords; filter by reading status
- **Reading Status Tracking** — Track papers as Not Started, Reading, or Completed
- **Input Validation & Sanitization** — XSS protection and input sanitization via custom library
- **Dashboard** — Visual overview with progress rings, stats cards, and animated UI

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│        Vite + Tailwind CSS + React Router               │
│            Port 5173 (dev) / Nginx (prod)               │
└───────────────────────┬────────────────────────────────┘
                        │  HTTP /api/*
┌───────────────────────▼────────────────────────────────┐
│                   Backend (FastAPI)                      │
│      Uvicorn ASGI · Port 8000 · REST API                │
│  ┌──────────────────────────────────────────────────┐   │
│  │              researchpaperlib                     │   │
│  │  DOI Resolver · Citation Generator · Validator    │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬────────────────────────────────┘
                        │  SQLAlchemy ORM
┌───────────────────────▼────────────────────────────────┐
│               PostgreSQL Database                       │
│         Tables: papers, notes                           │
└────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite 5, Tailwind CSS 3.4 | SPA with responsive UI |
| Backend | FastAPI 0.109, Uvicorn, SQLAlchemy 2.0 | REST API server |
| Database | PostgreSQL 16 | Persistent data storage |
| Library | researchpaperlib (custom) | DOI resolution, citations, validation |
| Container | Docker, Docker Compose | Containerization and orchestration |
| CI/CD | GitHub Actions | Automated build, test, lint, security scan, deploy |
| Cloud | AWS (EC2, S3, RDS) | Production deployment |

---

## Project Structure

```
research-paper-organizer/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── config.py          # Environment settings
│   │   ├── database.py        # SQLAlchemy setup
│   │   ├── models.py          # ORM models (Paper, Note)
│   │   ├── schemas.py         # Pydantic validation schemas
│   │   ├── routers/           # API route handlers
│   │   │   ├── papers.py      # Paper CRUD + DOI + citations
│   │   │   └── notes.py       # Note CRUD
│   │   └── services/          # Business logic layer
│   │       ├── doi_service.py
│   │       ├── paper_service.py
│   │       └── storage_service.py
│   └── requirements.txt
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.jsx            # Router and layout
│   │   ├── pages/             # Route pages
│   │   ├── components/        # Reusable UI components
│   │   └── services/api.js    # Axios API client
│   ├── package.json
│   └── vite.config.js
├── researchpaperlib/           # Custom Python library
│   ├── researchpaperlib/
│   │   ├── doi_resolver.py    # CrossRef/DataCite integration
│   │   ├── citation_generator.py  # APA/IEEE/BibTeX
│   │   ├── paper_validator.py # Input validation & sanitization
│   │   ├── models.py          # Data classes
│   │   └── exceptions.py      # Custom exceptions
│   ├── tests/
│   └── pyproject.toml
├── .github/workflows/
│   └── ci-cd.yml              # CI/CD pipeline
├── Dockerfile.backend          # Backend container
├── Dockerfile.frontend         # Frontend container
├── docker-compose.yml          # Multi-service orchestration
├── nginx.conf                  # Nginx reverse proxy config
├── .flake8                     # Python linting config
├── .bandit                     # Security scanning config
└── .gitignore
```

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci-cd.yml` and consists of 8 stages:

### Continuous Integration (CI)
1. **Python Lint (Flake8)** — Code style enforcement for backend and library
2. **Frontend Lint (ESLint)** — JavaScript/JSX code quality checks
3. **Security Scan (Bandit)** — Static security analysis of Python code
4. **Dependency Scan (pip-audit)** — Vulnerability scanning of Python packages
5. **Python Tests (Pytest)** — Unit tests for the custom library
6. **Build Frontend (Vite)** — Production build verification

### Continuous Deployment (CD)
7. **Docker Build & Push** — Build container images and push to AWS ECR
8. **Deploy to EC2** — SSH into EC2, pull images, restart services

```
Code Push → Lint → Security Scan → Test → Build → Docker → Deploy
                     │                                    │
                     │         CI (Continuous Integration) │  CD (Continuous Deployment)
                     └────────────────────────────────────┘
```

---

## API Endpoints

### Papers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/papers` | List papers (pagination, status filter) |
| POST | `/api/papers` | Create paper with optional PDF |
| GET | `/api/papers/{id}` | Get paper by ID |
| PUT | `/api/papers/{id}` | Update paper |
| DELETE | `/api/papers/{id}` | Delete paper and associated notes |
| PATCH | `/api/papers/{id}/status` | Update reading status |
| GET | `/api/papers/search?q=` | Search papers |
| GET | `/api/papers/stats` | Dashboard statistics |
| POST | `/api/papers/resolve-doi` | Resolve DOI to metadata |
| GET | `/api/papers/{id}/citation?format=` | Generate citation |
| GET | `/api/papers/{id}/download` | Download PDF |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/papers/{id}/notes` | Get notes for a paper |
| POST | `/api/papers/{id}/notes` | Create note |
| PUT | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (for containerized deployment)

### Local Development

**1. Clone the repository:**
```bash
git clone https://github.com/Rishiande/researchpaper.git
cd researchpaper
```

**2. Set up the database:**
```bash
createdb ResearchGate
```

**3. Install and run the backend:**
```bash
# Install custom library
cd researchpaperlib
pip install -e .
cd ..

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ResearchGate" > .env
echo "UPLOAD_DIR=./uploads" >> .env
echo "CORS_ORIGINS=http://localhost:5173" >> .env

# Start backend
uvicorn app.main:app --reload --port 8000
```

**4. Install and run the frontend:**
```bash
cd frontend
npm install
npm run dev
```

**5. Open the application:**
Navigate to `http://localhost:5173`

### Docker Deployment

```bash
# Build and start all services
docker compose up -d --build

# Access the application
open http://localhost
```

---

## Custom Library: researchpaperlib

The `researchpaperlib` package provides three core capabilities:

| Class | Purpose |
|-------|---------|
| `DOIResolver` | Resolves DOIs via CrossRef and DataCite APIs |
| `CitationGenerator` | Generates APA, IEEE, and BibTeX citations |
| `PaperValidator` | Validates and sanitizes paper input data |

### Usage Example
```python
from researchpaperlib import DOIResolver, CitationGenerator

resolver = DOIResolver()
paper = resolver.resolve("10.1145/3292500.3330648")

generator = CitationGenerator()
citation = generator.to_apa(paper)
print(citation)
```

### Running Library Tests
```bash
cd researchpaperlib
pip install -e .[dev]
pytest tests/ -v --cov=researchpaperlib
```

---

## Static Code Analysis

### Python — Bandit (Security)
```bash
bandit -r backend/app -f txt
bandit -r researchpaperlib/researchpaperlib -f txt
```

### Python — Flake8 (Linting)
```bash
flake8 backend/app --max-line-length=120
flake8 researchpaperlib/researchpaperlib --max-line-length=120
```

### JavaScript — ESLint
```bash
cd frontend
npx eslint src/ --ext .js,.jsx
```

### Dependency Vulnerabilities — pip-audit
```bash
pip-audit -r backend/requirements.txt
```

---

## Deployment (AWS)

The application is deployed on AWS using:
- **Amazon EC2** — Hosts Docker containers (backend + frontend + database)
- **Amazon S3** — PDF document storage (production)
- **Amazon RDS PostgreSQL** — Managed database (production)
- **Amazon ECR** — Docker image registry

---

## License

This project was developed as part of the MSc in Cloud Computing programme at the National College of Ireland.
