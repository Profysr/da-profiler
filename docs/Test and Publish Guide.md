# Da Profiler — Publishing & Testing Guide (ELI5) 📦🧪

This guide explains, in plain and simple words, how to **publish** the Da Profiler packages (Python + React dashboard) and how to **test** them — both locally before releasing and after they are published.

Think of it like packing a toy into a box and shipping it to a store. We want to make sure the toy works at home before we ship it, and we want to make sure it still works when someone buys it from the store.

---

## 🧠 The Big Picture (ELI5)

Da Profiler has **two parts**, like a Lego set with two kits:

| Part | What it is | Where it ships to |
|------|------------|-------------------|
| **Python package** (`da-profiler`) | The brain — it finds slow queries in your Django app | **PyPI** (Python's app store) |
| **React dashboard** (`@da-profiler/dashboard`) | The screen — a nice UI to see what the brain found | **npm** (JavaScript's app store) |

You can use the brain alone, or add the screen. They ship separately, like buying a phone and a case separately.

---

## 📋 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Testing Locally (Before Publishing)](#-testing-locally-before-publishing)
3. [Publishing to the Stores](#-publishing-to-the-stores)
4. [Testing After Publishing](#-testing-after-publishing)
5. [Versioning & Releases](#-versioning--releases)
6. [CI/CD (The Robots That Test For You)](#-cicd-the-robots-that-test-for-you)
7. [Common Problems & Fixes](#-common-problems--fixes)
8. [Quick Command Cheat Sheet](#-quick-command-cheat-sheet)

---

## 🏗️ Architecture Overview

```
da-profiler/
├── dqs/                          # Python package (PyPI: da-profiler)
│   ├── adapters/drf/
│   │   └── ... (HTTP API only; no HTML templates)
│   └── ...
├── fe/                           # React frontend (npm: @da-profiler/dashboard)
│   ├── bin/dashboard.js           # CLI entry point
│   ├── src/
│   ├── dist/                      # Built output (after npm run build)
│   └── package.json
└── docs/
```

**Key idea**: The brain works without the screen. You can install just the Python package, or add the dashboard later, or run the dashboard on its own with `npx @da-profiler/dashboard`.

---

## 🧪 Testing Locally (Before Publishing)

Before shipping anything, we test it at home. There are **three ways** to test the Python package and **three ways** to test the dashboard. Pick the one that fits your situation.

### A) Test the Python Package Locally

You need these tools first:

```bash
pip install build twine pytest ruff
```

#### Way 1: Run the test suite (fastest)

Da Profiler's tests live in `tests/` and are split into two groups using "markers":

| Marker | What it tests | Needs a database? | Speed |
|--------|---------------|-------------------|-------|
| `core` | Pure Python brain (no Django) | No | ⚡ Fastest |
| `django` | Django + DRF adapter | Yes (PostgreSQL) | 🐢 Slower |

```bash
# 1. Install the package in "editable" mode (changes show up instantly)
pip install -e ".[dev]"

# 2. Go to the demo Django project (for the django-marked tests)
cd demos/drf

# 3. Set up the shadow database (a safe copy we test against)
python manage.py migrate --database=dqs_shadow

# 4. Run the tests
pytest -m core        # Quick pure-Python tests
pytest -m django      # Slower Django tests
pytest -v             # Everything, with verbose output
```

> **ELI5**: Editable mode (`-e`) means "link to my code, don't copy it." Every time you save a file, the tests use your latest changes.

#### Way 2: Test your changes inside a real Django project

This is for when you want to see how your changes behave in someone else's Django app.

```bash
# 1. In your Django project folder:
pip install -e /path/to/da-profiler[django]

# 2. Verify it's using your local code (not the PyPI version)
python -c "import dqs; print(dqs.__file__)"
# It should print a path inside /path/to/da-profiler/

# 3. Run Django and try it out
python manage.py runserver
```

#### Way 3: Test the built package (dry-run before shipping)

This simulates what a real user will experience after you publish.

```bash
# 1. Build the package into a wheel file
cd /path/to/da-profiler
python -m build
# Creates: dist/da_profiler-0.3.0-py3-none-any.whl

# 2. Make a clean sandbox (a fresh virtual room with nothing extra installed)
python -m venv /tmp/test-env
source /tmp/test-env/bin/activate    # Windows: \tmp\test-env\Scripts\activate

# 3. Install ONLY the built wheel into the clean room
pip install dist/da_profiler-0.3.0-py3-none-any.whl[django]

# 4. Try it out — import it, use it, run the demo project
```

> **ELI5**: This is like putting your toy in a brand-new empty room to make sure it works without any of your home's special setup.

---

### B) Test the Dashboard Locally

You need Node.js (≥20) and npm (≥10).

#### Way 1: Hot-reload dev mode (while you code)

```bash
# Terminal 1: Start your Django backend
cd /path/to/your/django/project
python manage.py runserver 8000

# Terminal 2: Start the dashboard with hot reload
cd /path/to/da-profiler/fe
npm install
npm run dev
# Opens at http://localhost:5173 — refreshes automatically as you save files
```

Then in the browser:
1. Add Project → URL: `http://localhost:8000`
2. Click **Test Connection** → **Connect**
3. Profile routes and watch your changes appear instantly.

#### Way 2: Test the CLI command

```bash
cd /path/to/da-profiler/fe

# Make the `daprofiler-dashboard` command available everywhere on your computer
npm link

# Now run it from any folder
daprofiler-dashboard
# It should start Vite and open your browser automatically
```

#### Way 3: Test the built + packed dashboard (dry-run)

```bash
cd /path/to/da-profiler/fe

# 1. Build the production bundle
npm run build                       # Creates dist/ with index.html and assets

# 2. Pack it into a .tgz file (like putting it in a shipping box)
npm pack                            # Creates @da-profiler-dashboard-0.1.0.tgz

# 3. Install that .tgz globally as if a user downloaded it from npm
npm install -g ./@da-profiler-dashboard-0.1.0.tgz

# 4. Run it — must work without any local source code
da-profiler-dashboard
```

---

### C) Test Both Together (End-to-End)

The strongest test: build both packages, install them in a clean environment, and run the dashboard CLI against a fresh Django project.

```bash
# 1. Build both
cd /path/to/da-profiler
python -m build && (cd fe && npm run build && npm pack)

# 2. Create a clean Python room
python -m venv /tmp/test-env
source /tmp/test-env/bin/activate

# 3. Install both built packages
pip install dist/da_profiler-*.whl[django]
npm install -g /path/to/da-profiler/fe/@da-profiler-dashboard-*.tgz

# 4. Set up a fresh Django project, then run the dashboard
da-profiler-dashboard
```

---

### D) Running Package Tests in Different Environments

#### Option 1: From the source repository (recommended)

```bash
pip install -e ".[dev]"
cd demos/drf
python manage.py migrate --database=dqs_shadow
pytest -m core
pytest -m django
```

#### Option 2: Docker Compose (full stack, no local setup needed)

```bash
docker compose build
docker compose up -d db
docker compose up -d
docker compose exec web pytest -m core
docker compose exec web pytest -m django
```

#### Option 3: Install the built wheel into the demo project

```bash
pip install build
python -m build
cd demos/drf
pip install ../../dist/da_profiler-0.3.0-py3-none-any.whl[django]
python manage.py migrate --database=dqs_shadow
pytest -m core
pytest -m django
```

---

### E) Test Fixtures Available to DRF Adapter Tests

| Fixture | Type | Description |
|---------|------|-------------|
| `runner` | `DjangoSandboxRunner` | Pre-initialized sandbox runner |
| `introspector` | `DjangoIntrospector` | Pre-initialized URL introspector |
| `seeded_book` | `Book` | Seeded `Publisher → Author → Book` relational record |
| `enforce_debug_mode` | `autouse` | Forces `DEBUG=True` for all DRF adapter tests |

---

## 🚀 Publishing to the Stores

Once tests pass, it's time to ship.

### Part 1: Publish the Python package to PyPI

**Tools you need**: Python ≥3.10, `build`, `twine`.

#### Pre-publish checklist

```bash
# 1. Run all tests one more time
pytest -m core
pytest -m django
pytest

# 2. Lint
ruff check dqs/

# 3. Build
python -m build

# 4. Check what got built
ls dist/
# Should show: da_profiler-0.3.0-py3-none-any.whl + .tar.gz

# 5. Validate the package metadata
twine check dist/*
```

#### Publish

```bash
# Easy mode: upload to Test PyPI first (a practice store)
twine upload --repository testpypi dist/*

# Real mode: upload to the real PyPI
twine upload dist/*

# Verify a user can install it
pip install --index-url https://test.pypi.org/simple/ da-profiler[django]
```

> **ELI5**: Test PyPI is the "dress rehearsal" store. The real PyPI is the public store everyone uses.

### Part 2: Publish the dashboard to npm

**Tools you need**: Node.js ≥20, npm ≥10.

#### Pre-publish checklist

```bash
cd fe/

npm install
npm run lint            # Check for code issues
npm run build           # Build production bundle
ls dist/                # Verify build output (index.html, assets/...)
node bin/dashboard.js    # Quick local CLI check
npm pack                # Creates @da-profiler-dashboard-0.1.0.tgz
npx ./@da-profiler-dashboard-0.1.0.tgz   # Test the packed CLI
```

#### Publish

```bash
cd fe/

# One-time login
npm login

# Publish publicly (scoped packages need --access public)
npm publish --access public

# Verify
npm view @da-profiler/dashboard
npm install -g @da-profiler/dashboard
da-profiler-dashboard   # Should work globally
```

---

## ✅ Testing After Publishing

After the package is live on PyPI or npm, you want to confirm the **published** version works for real users — not just your local machine.

### Test the published Python package

```bash
# 1. Create a clean room so you don't accidentally use your local code
python -m venv /tmp/published-test
source /tmp/published-test/bin/activate

# 2. Install from the REAL public PyPI (no local paths!)
pip install da-profiler[django]

# 3. Confirm it's the version you just published
python -c "import dqs; print(dqs.__version__)"

# 4. Set up a Django project and run profiling
#    (follow the Integration section below)
```

### Test the published dashboard

```bash
# 1. Install the published package globally
npm install -g @da-profiler/dashboard

# 2. Run it — it must work without cloning the repo
da-profiler-dashboard

# 3. Or use the one-off npx command (no install needed)
npx @da-profiler/dashboard
```

### Verify in a real Django project

To use the published `da-profiler` in your Django app:

1. **Install**:
   ```bash
   pip install da-profiler[django]
   ```

2. **Register** in `settings.py` (only when `DEBUG=True`):
   ```python
   if DEBUG:
       INSTALLED_APPS += ["dqs.adapters.drf"]
   ```

3. **Configure a shadow database** (a safe copy to run tests against):
   ```python
   DATABASES = {
       "default": { /* your real DB */ },
       "dqs_shadow": { /* same engine, separate test DB */ },
   }
   ```
   ```bash
   python manage.py migrate --database=dqs_shadow
   ```

4. **Profile an endpoint programmatically** — payloads are caller-supplied, no auto-seeding:
   ```python
   from dqs.adapters.drf.execution.runner import DjangoSandboxRunner

   runner = DjangoSandboxRunner()
   result = runner.execute_request(
       url_name_or_path="/api/v1/books/",
       method="GET",
       body={"q": "python"},
   )
   print(f"Queries: {result.metrics['total_queries']}")
   for n1 in result.analysis:
       print(f"🚨 N+1: {n1['fingerprint']} at {n1['src_loc']}")
   ```

   > Note: the `dqs/adapters/drf/mocking/` directory was deleted in the v0.35 cleanup. The runner now runs purely against the default DB inside an atomic savepoint that rolls back automatically (`sandbox=True`, the default).

6. **Or use the AI agent loop** (Cursor / Windsurf / Claude Code via MCP):
   ```bash
   python -m dqs.mcp.server
   ```
   The agent lists routes, profiles endpoints, reads the AST findings, rewrites the code, and re-profiles to verify the fix worked.

---

## 🔢 Versioning & Releases

Both packages use **SemVer** (`MAJOR.MINOR.PATCH`) and **version independently**. The dashboard can ship a UI fix without touching Python.

| Package | Bump example |
|---------|--------------|
| Python (`da-profiler`) | `0.3.0` → `0.4.0` in `pyproject.toml` |
| npm (`@da-profiler/dashboard`) | `0.1.0` → `0.2.0` in `fe/package.json` |

### Release steps

```bash
# 1. Bump versions in pyproject.toml and/or fe/package.json
# 2. Update CHANGELOG.md
# 3. Tag the release
git tag -a v0.4.0 -m "Release v0.4.0"
git tag -a dashboard-v0.2.0 -m "Dashboard v0.2.0"
git push origin --tags
# 4. CI/CD does the actual publishing (see next section)
```

---

## 🤖 CI/CD (The Robots That Test For You)

You can set up GitHub Actions to automatically test every push and publish on every tag.

### Python CI (test on every push)

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

### Dashboard CI

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

### Automated release (publish on tag push)

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*', 'dashboard-v*']
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

## 🛠️ Common Problems & Fixes

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: dqs` | Install with `pip install -e ".[django]"`, not `pip install -e .` |
| Dashboard can't connect to Django | Ensure Django `DEBUG=True` and `DATABASE_ROUTERS` are configured |
| CORS errors | Dashboard uses `withCredentials: true` — Django must allow credentials |
| `uuid` not found in build | Add `"uuid": "^9.0.0"` to `fe/package.json` dependencies |
| CLI doesn't open browser | Check that the `open` package is installed; try `http://localhost:5173` manually |
| Published version is old | Make sure you're not in editable mode. Use a fresh venv. |

---

## 📝 Quick Command Cheat Sheet

### Python package
```bash
pip install -e ".[django]"        # Develop
pytest -m core                    # Quick tests
pytest -m django                   # DB tests
python -m build                    # Build
twine upload dist/*                # Publish
```

### Dashboard package
```bash
cd fe && npm install && npm run dev   # Develop
cd fe && npm link                       # Global CLI
daprofiler-dashboard                    # Test CLI
cd fe && npm run build                  # Build
cd fe && npm publish --access public    # Publish
```

### End-to-end local test
```bash
python -m build && (cd fe && npm run build && npm pack)
pip install dist/da_profiler-*.whl[django]
npm install -g fe/@da-profiler-dashboard-*.tgz
da-profiler-dashboard
```

### Test the published packages
```bash
pip install da-profiler[django]            # From real PyPI
npm install -g @da-profiler/dashboard      # From real npm
# Or: npx @da-profiler/dashboard            # One-off, no install
```

---

## 🔗 Related Documentation

- [Quickstart Guide](./Quickstart.md) — 5-minute setup
- [Architecture Blueprint](../architecture.md) — Technical deep-dive
- [Developer Onboarding](./Developer%20Onboarding.md) — File-by-file reference
- [How It Works](./How%20it%20work.md) — ELI5 explanations
