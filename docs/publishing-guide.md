# Da Profiler — Package Publishing & Local Testing Guide 📦

This guide covers everything you need to publish both the **Python package** (`da-profiler` on PyPI) and the **React dashboard** (`@da-profiler/dashboard` on npm), plus how to test them locally before releasing.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Python Package (`da-profiler`) — Publishing](#python-package-da-profiler--publishing)
3. [React Dashboard (`@da-profiler/dashboard`) — Publishing](#react-dashboard-da-profilerdashboard--publishing)
4. [Local Testing Workflow](#local-testing-workflow)
5. [Versioning & Release Process](#versioning--release-process)
6. [CI/CD Integration](#cicd-integration)

---

## 🏗️ Architecture Overview

```
da-profiler/
├── dqs/                          # Python package (PyPI: da-profiler)
│   ├── adapters/drf/
│   │   ├── templates/dqs/        # Minimal HTML fallback (optional)
│   │   └── static/dqs/           # Served via Django collectstatic
│   └── ...
├── fe/                           # React frontend (npm: @da-profiler/dashboard)
│   ├── bin/dashboard.js          # CLI entry point
│   ├── src/
│   ├── dist/                     # Built output (after npm run build)
│   └── package.json
└── docs/
```

**Key Separation Principle**: The Python package is **optional without the dashboard**. Users can:
- Use `da-profiler` Python package alone (programmatic API)
- Add `@da-profiler/dashboard` for visual profiling UI
- Run dashboard independently via `npx @da-profiler/dashboard`

---

## 🐍 Python Package (`da-profiler`) — Publishing

### **Prerequisites**

| Tool | Version | Purpose |
|------|---------|---------|
| Python | ≥3.10 | Runtime |
| `build` | latest | Build wheel/sdist |
| `twine` | latest | Upload to PyPI |
| `pytest` | ≥8.0 | Testing |
| `ruff` | ≥0.8 | Linting |

Install:
```bash
pip install build twine pytest ruff
```

### **Package Configuration** (`pyproject.toml`)

```toml
[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "da-profiler"
version = "0.3.0"
description = "Isolated query profiling and mock-data sandbox for Django REST endpoints"
readme = "README.md"
requires-python = ">=3.10"
license = { text = "MIT" }
authors = [{ name = "Bilal Ahmad", email = "bilal072ahmad@gmail.com" }]

# Core deps only — framework-agnostic
dependencies = [
    "sqlglot>=26.0.0",
]

[project.optional-dependencies]
django = [
    "django>=4.2",
    "djangorestframework>=3.15.2",
    "model_bakery>=1.23",
    "psycopg2-binary>=2.9",
]

dev = [
    "pytest>=8.3",
    "pytest-django>=4.9",
    "ruff>=0.8",
]

[tool.setuptools.packages.find]
include = ["dqs*"]

# Include HTML dashboard templates in package builds
[tool.setuptools.package-data]
"dqs.adapters.drf" = ["templates/dqs/*.html"]
```

### **Pre-Publish Checklist**

```bash
# 1. Run all tests
pytest -m core        # Pure Python tests (fast, no DB)
pytest -m django      # Django/DRF adapter tests (requires DB)
pytest                # All tests

# 2. Lint & type-check
ruff check dqs/
# mypy dqs/  # if using mypy

# 3. Build package
python -m build

# 4. Inspect built artifacts
ls dist/
# Should see: da_profiler-0.3.0-py3-none-any.whl + .tar.gz

# 5. Validate package metadata
twine check dist/*
```

### **Publishing to PyPI**

```bash
# Test PyPI first (recommended)
twine upload --repository testpypi dist/*

# Production PyPI
twine upload dist/*

# Verify installation
pip install --index-url https://test.pypi.org/simple/ da-profiler[django]
```

### **Dependencies Explained**

| Dependency | Why Required | Where Used |
|------------|--------------|------------|
| `sqlglot` | SQL AST parsing & fingerprinting | `dqs/core/analyzer.py` |
| `django` (optional) | Django integration | `dqs/adapters/drf/*` |
| `djangorestframework` | DRF view introspection | `introspector.py`, `views.py` |
| `model_bakery` | Mock data generation | `mocking/generator.py` |
| `psycopg2-binary` | PostgreSQL driver for shadow DB | `database/db_manager.py` |
| `pytest-django` | Testing Django adapters | `tests/` |

---

## ⚛️ React Dashboard (`@da-profiler/dashboard`) — Publishing

### **Prerequisites**

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥20 LTS | Runtime |
| npm | ≥10 | Package manager |
| `vite` | ≥8 | Build tool |

### **Package Configuration** (`fe/package.json`)

```json
{
  "name": "@da-profiler/dashboard",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "daprofiler-dashboard": "./bin/dashboard.js",
    "da-profiler-dashboard": "./bin/dashboard.js"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "files": [
    "dist",
    "bin"
  ],
  "dependencies": {
    "axios": "^1.19.0",
    "clsx": "^2.1.1",
    "framer-motion": "^13.0.0",
    "highlight.js": "^11.11.1",
    "lucide-react": "^1.30.0",
    "open": "^10.1.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-virtualized-auto-sizer": "^2.0.3",
    "react-window": "^2.3.0",
    "tailwind-merge": "^3.6.0",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.4",
    "tailwindcss": "^4.3.3",
    "eslint": "^10.8.0",
    "prettier": "^3.9.6"
  }
}
```

### **CLI Entry Point** (`fe/bin/dashboard.js`)

```javascript
#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import open from 'open';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

console.log('🚀 Da Profiler Dashboard starting...');
console.log('📍 Frontend: http://localhost:5173');

const vite = spawn('npx', ['vite', '--port', '5173', '--host'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BROWSER: 'none' }
});

setTimeout(() => open('http://localhost:5173'), 2000);

process.on('SIGINT', () => { vite.kill(); process.exit(0); });
```

### **Pre-Publish Checklist**

```bash
cd fe/

# 1. Install deps
npm install

# 2. Lint
npm run lint

# 3. Build production bundle
npm run build

# 4. Verify build output
ls dist/
# Should have: index.html, assets/index-*.js, assets/index-*.css

# 5. Test CLI locally
node bin/dashboard.js
# Should start Vite + open browser

# 6. Test packaged CLI
npm pack
# Creates @da-profiler-dashboard-0.1.0.tgz
npx ./@da-profiler-dashboard-0.1.0.tgz
```

### **Publishing to npm**

```bash
cd fe/

# 1. Login (one-time)
npm login

# 2. Publish (public scope requires paid npm org, or use scoped private)
npm publish --access public

# For scoped packages under organization:
# npm publish --access public --registry=https://npm.pkg.github.com

# 3. Verify
npm view @da-profiler/dashboard
npm install -g @da-profiler/dashboard
da-profiler-dashboard  # Should work globally
```

### **Dependencies Explained**

| Dependency | Why Required |
|------------|--------------|
| `axios` | HTTP client for Django API calls |
| `zustand` | State management (connections, routes, profiles) |
| `lucide-react` | Icons for all target kinds |
| `framer-motion` | Animations (sidebar, modals) |
| `react-window` | Virtualized lists for large target sets |
| `tailwind-merge` + `clsx` | Utility class merging |
| `open` | Auto-open browser in CLI |
| `highlight.js` | SQL/JSON syntax highlighting |

---

## 🧪 Local Testing Workflow

### **Scenario A: Test Python Package Changes in a Django Project**

```bash
# 1. In da-profiler repo - make changes to dqs/
cd /path/to/da-profiler

# 2. In your Django project - install in editable mode
cd /path/to/your/django/project
pip install -e /path/to/da-profiler[django]

# 3. Verify changes picked up
python -c "import dqs.adapters.drf; print(dqs.__file__)"
# Should show your local path

# 4. Run Django with your changes
python manage.py runserver
```

### **Scenario B: Test Dashboard Changes Against a Django Project**

```bash
# Terminal 1: Django project (backend)
cd /path/to/test/django/project
python manage.py runserver 8000

# Terminal 2: Dashboard (frontend) - linked for hot reload
cd /path/to/da-profiler/fe
npm link                    # Makes `daprofiler-dashboard` available globally
npm run dev                 # Starts Vite with HMR on port 5173

# Browser: http://localhost:5173
# 1. Add Project → URL: http://localhost:8000
# 2. Test Connection → Connect
# 3. Profile routes → Verify your changes
```

### **Scenario C: Test Fully Built Packages (Pre-Publish Simulation)**

```bash
# 1. Build both packages
cd /path/to/da-profiler
python -m build                    # Creates dist/*.whl

cd fe
npm run build                      # Creates dist/
npm pack                           # Creates .tgz

# 2. Create clean test environment
python -m venv /tmp/test-env
source /tmp/test-env/bin/activate

# 3. Install built Python package
pip install /path/to/da-profiler/dist/da_profiler-0.3.0-py3-none-any.whl[django]

# 4. Install built dashboard globally
npm install -g /path/to/da-profiler/fe/@da-profiler-dashboard-0.1.0.tgz

# 5. Test in a fresh Django project
cd /tmp/fresh-django-project
# ... setup Django with da-profiler ...

# 6. Run dashboard CLI
da-profiler-dashboard
# Should work without any local source code
```

### **Scenario D: Multi-Project Dashboard Testing**

```bash
# Terminal 1: Project A
cd /path/to/project-a
python manage.py runserver 8000

# Terminal 2: Project B
cd /path/to/project-b
python manage.py runserver 8001

# Terminal 3: Dashboard
cd /path/to/da-profiler/fe
npm run dev

# Browser: http://localhost:5173
# 1. Add Project A → http://localhost:8000
# 2. Add Project B → http://localhost:8001
# 3. Switch between projects via dropdown in TopNavBar
# 4. Verify targets load per-project correctly
```

---

## 🔢 Versioning & Release Process

### **Version Strategy**

| Package | Scheme | Example |
|---------|--------|---------|
| Python (`da-profiler`) | SemVer | `0.3.0`, `0.4.0`, `1.0.0` |
| npm (`@da-profiler/dashboard`) | SemVer (independent) | `0.1.0`, `0.2.0`, `1.0.0` |

**Both packages version independently** — dashboard can release UI fixes without Python changes.

### **Release Checklist**

```bash
# 1. Update versions
# Python: pyproject.toml version = "0.4.0"
# npm:    fe/package.json version = "0.2.0"

# 2. Update CHANGELOG.md for both

# 3. Tag release
git tag -a v0.4.0 -m "Release v0.4.0"
git tag -a dashboard-v0.2.0 -m "Dashboard v0.2.0"
git push origin --tags

# 4. Publish (CI/CD handles this on tag push)
```

### **Automated Release (GitHub Actions)**

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'           # Python releases
      - 'dashboard-v*' # Dashboard releases

jobs:
  python-release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install build twine
      - run: python -m build
      - run: twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}

  dashboard-release:
    if: startsWith(github.ref, 'refs/tags/dashboard-v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', registry-url: 'https://registry.npmjs.org' }
      - run: cd fe && npm ci && npm run build
      - run: cd fe && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 🔄 CI/CD Integration

### **Python Package CI**

```yaml
# .github/workflows/python-ci.yml
name: Python CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        ports: [5432:5432]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -e ".[django,dev]"
      - run: pytest -m core
      - run: pytest -m django
      - run: ruff check dqs/
```

### **Dashboard CI**

```yaml
# .github/workflows/dashboard-ci.yml
name: Dashboard CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: 'fe/package-lock.json' }
      - run: cd fe && npm ci
      - run: cd fe && npm run lint
      - run: cd fe && npm run build
```

---

## 📝 Quick Reference Commands

### **Python Package**
```bash
# Development
pip install -e ".[django]"

# Test
pytest -m core
pytest -m django

# Build
python -m build

# Publish
twine upload dist/*
```

### **Dashboard Package**
```bash
# Development
cd fe && npm install && npm run dev

# Link for global CLI
cd fe && npm link

# Test CLI
daprofiler-dashboard

# Build
cd fe && npm run build

# Publish
cd fe && npm publish --access public
```

### **End-to-End Local Test**
```bash
# 1. Build both
python -m build && cd fe && npm run build

# 2. Install in clean env
pip install /path/to/dist/da_profiler-*.whl[django]
npm install -g /path/to/fe/@da-profiler-dashboard-*.tgz

# 3. Test
da-profiler-dashboard
```

---

## ⚠️ Common Pitfalls

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: dqs` | Use `pip install -e ".[django]"` not `pip install -e .` |
| Dashboard can't connect | Ensure Django `DEBUG=True` and `DATABASE_ROUTERS` configured |
| CORS errors | Dashboard uses `withCredentials: true` — Django must allow credentials |
| `uuid` not found in build | Add `"uuid": "^9.0.0"` to `fe/package.json` dependencies |
| CLI doesn't open browser | Check `open` package installed; try manual `http://localhost:5173` |

---

## 🔗 Related Documentation

- [Quickstart Guide](./quickstart.md) — 5-minute setup
- [Architecture Blueprint](../architecture.md) — Technical deep-dive
- [Developer Onboarding](./developer-onboarding.md) — File-by-file reference
- [How It Works](./how-it-works.md) — ELI5 explanations