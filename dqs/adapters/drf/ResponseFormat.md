```python
import os
from weasyprint import HTML

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 16mm 14mm;
    background-color: #0f172a;
  }
  
  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #e2e8f0;
    background-color: #0f172a;
    font-size: 10pt;
    line-height: 1.5;
  }

  /* Header Bar */
  .header {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid #334155;
    border-left: 4px solid #38bdf8;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .header h1 {
    margin: 0 0 6px 0;
    font-size: 18pt;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: -0.02em;
  }

  .header p {
    margin: 0;
    font-size: 9.5pt;
    color: #94a3b8;
  }

  /* Headings */
  h2 {
    font-size: 13pt;
    font-weight: 600;
    color: #38bdf8;
    margin: 20px 0 10px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #334155;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11pt;
    font-weight: 600;
    color: #f1f5f9;
    margin: 14px 0 6px 0;
    page-break-after: avoid;
  }

  p, ul, ol {
    margin: 0 0 10px 0;
  }

  /* Code & Pre */
  code {
    font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
    font-size: 8.5pt;
    background-color: #1e293b;
    color: #38bdf8;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #334155;
  }

  pre {
    background-color: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
    font-size: 8pt;
    line-height: 1.4;
    color: #e2e8f0;
    margin: 0 0 14px 0;
    page-break-inside: avoid;
  }

  /* Method Badges */
  .badge-get {
    color: #4ade80;
    font-weight: bold;
  }
  .badge-post {
    color: #fbbf24;
    font-weight: bold;
  }

  /* Parameter Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }

  th {
    background-color: #1e293b;
    color: #f8fafc;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #334155;
    font-weight: 600;
  }

  td {
    padding: 8px 10px;
    border: 1px solid #334155;
    background-color: #0f172a;
    color: #cbd5e1;
  }

  tr:nth-child(even) td {
    background-color: #182234;
  }

  .tag {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 600;
    text-transform: uppercase;
  }

  .tag-req {
    background-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .tag-opt {
    background-color: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.4);
  }

  /* Notice Box */
  .notice {
    background-color: rgba(56, 189, 248, 0.1);
    border-left: 3px solid #38bdf8;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0 14px 0;
    font-size: 9pt;
    color: #bae6fd;
  }

  .notice-warning {
    background-color: rgba(245, 158, 11, 0.1);
    border-left: 3px solid #f59e0b;
    color: #fde68a;
  }
</style>
</head>
<body>

  <div class="header">
    <h1>Profiler API Documentation</h1>
    <p>Complete specification of request structures, response formats, and core data types for the Profiler endpoints.</p>
  </div>

  <h2>Endpoints Overview</h2>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Endpoint</th>
        <th>View Class</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-get">GET</span></td>
        <td><code>/profiler/manage/routes</code></td>
        <td><code>ManageRoutesView</code></td>
        <td>Fetch available target routes, static findings, and counts.</td>
      </tr>
      <tr>
        <td><span class="badge-post">POST</span></td>
        <td><code>/profiler/execute</code></td>
        <td><code>ExecuteView</code></td>
        <td>Execute route profiling or return static analysis.</td>
      </tr>
      <tr>
        <td><span class="badge-get">GET</span></td>
        <td><code>/profiler/connection/health</code></td>
        <td><code>ConnectionHealthView</code></td>
        <td>Check profiler connection and shadow DB health.</td>
      </tr>
    </tbody>
  </table>

  <h2>1. Manage Routes</h2>
  <p><strong>GET</strong> <code>/profiler/manage/routes</code></p>
  <p>Returns the catalog of all detected targets (views, tasks, consumers, signals) along with aggregated counts and static findings.</p>

  <h3>Response Format</h3>
  <pre><code>{
  "targets": [
    {
      "id": "view:/api/v1/books/",
      "kind": "view",
      "can_execute": true,
      "target_details": {
        "path": "/api/v1/books/",
        "methods": ["GET", "POST"],
        "url_params": [{"name": "pk", "converter": "int"}],
        "target_model": "books.Book"
      },
      "static_findings": [
        {
          "type": "N_PLUS_ONE",
          "message": "Potential N+1: Book.objects.select_related('author')",
          "file": "views.py",
          "line": 42
        }
      ],
      "name": "/api/v1/books/",
      "methods": ["GET", "POST"],
      "path": "/api/v1/books/",
      "url_params": [{"name": "pk", "converter": "int"}]
    },
    {
      "id": "task:books.tasks.sync_covers",
      "kind": "task",
      "can_execute": true,
      "target_details": {
        "task_name": "books.tasks.sync_covers"
      },
      "static_findings": [],
      "name": "books.tasks.sync_covers"
    }
  ],
  "counts": {
    "view": 12,
    "task": 3,
    "consumer": 1
  },
  "total": 16
}</code></pre>

  <h2>2. Execute Target / Profile Route</h2>
  <p><strong>POST</strong> <code>/profiler/execute</code></p>

  <div class="notice notice-warning">
    <strong>Execution Note:</strong> Targets with <code>kind</code> in <code>("task", "consumer", "signal")</code> will return static analysis only (no live execution).
  </div>

  <h3>Request Parameters</h3>
  <table>
    <thead>
      <tr>
        <th>Field</th>
        <th>Type</th>
        <th>Status</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>target_id</code></td>
        <td><code>string</code></td>
        <td><span class="tag tag-req">Required</span></td>
        <td>—</td>
        <td>Unique target identifier (e.g., <code>view:/api/v1/books/</code>).</td>
      </tr>
      <tr>
        <td><code>kind</code></td>
        <td><code>string</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td><code>"view"</code></td>
        <td>Target category (<code>view</code>, <code>task</code>, <code>consumer</code>, <code>signal</code>).</td>
      </tr>
      <tr>
        <td><code>route</code></td>
        <td><code>string</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td>—</td>
        <td>Target URL pattern.</td>
      </tr>
      <tr>
        <td><code>method</code></td>
        <td><code>string</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td><code>"GET"</code></td>
        <td>HTTP method for request execution.</td>
      </tr>
      <tr>
        <td><code>path_params</code></td>
        <td><code>object</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td>—</td>
        <td>Path variables (e.g., <code>{"pk": 42}</code>).</td>
      </tr>
      <tr>
        <td><code>query_params</code></td>
        <td><code>object</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td>—</td>
        <td>URL query parameters (e.g., <code>{"page": 1}</code>).</td>
      </tr>
      <tr>
        <td><code>headers</code></td>
        <td><code>object</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td>—</td>
        <td>Request headers (e.g., <code>{"Authorization": "Bearer <token>"}</code>).</td>
      </tr>
      <tr>
        <td><code>body</code></td>
        <td><code>object</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td>—</td>
        <td>JSON payload body.</td>
      </tr>
      <tr>
        <td><code>sandbox</code></td>
        <td><code>boolean</code></td>
        <td><span class="tag tag-opt">Optional</span></td>
        <td><code>true</code></td>
        <td>Whether to run execution inside a isolated sandbox DB session.</td>
      </tr>
    </tbody>
  </table>

  <h3>Request Payload Example</h3>
  <pre><code>{
  "target_id": "view:/api/v1/books/",
  "kind": "view",
  "route": "/api/v1/books/",
  "method": "GET",
  "path_params": {"pk": 42},
  "query_params": {"page": 1},
  "headers": {"Authorization": "Bearer <token>"},
  "body": {"title": "New Book"},
  "sandbox": true
}</code></pre>

  <h3>Success Response Format (ProfileResult)</h3>
  <pre><code>{
  "path": "/api/v1/books/42/",
  "status_code": 200,
  "metrics": {
    "total_queries": 5,
    "unique_fingerprints": 3,
    "db_time_ms": 12.4,
    "n_plus_one_detected": true,
    "n_plus_one_groups": [
      {
        "fingerprint": "SELECT * FROM books_book WHERE author_id = ?",
        "count": 4,
        "src_loc": "views.py:42",
        "suggestion": "Book.objects.select_related('author')"
      }
    ]
  },
  "queries": [
    {
      "sql": "SELECT * FROM books_book WHERE id = 42",
      "fingerprint": "SELECT * FROM books_book WHERE id = ?",
      "time_ms": 1.2,
      "src_loc": "views.py:38"
    },
    {
      "sql": "SELECT * FROM books_author WHERE id = 1",
      "fingerprint": "SELECT * FROM books_author WHERE id = ?",
      "time_ms": 0.8,
      "src_loc": "views.py:42"
    }
  ],
  "analysis": [
    {
      "fingerprint": "SELECT * FROM books_author WHERE id = ?",
      "count": 4,
      "src_loc": "views.py:42",
      "target_model": "books.Author",
      "suggestion": "Book.objects.select_related('author')",
      "sample_queries": [
        {
          "sql": "SELECT * FROM books_author WHERE id = 1",
          "time_ms": 0.8,
          "src_loc": "views.py:42"
        }
      ]
    }
  ],
  "error": null,
  "side_effect_warnings": [],
  "response_body": {
    "id": 42,
    "title": "Django for APIs",
    "author": {
      "id": 1,
      "name": "William Vincent"
    }
  },
  "response_size": 156,
  "request": {
    "route": "/api/v1/books/",
    "method": "GET",
    "resolved_url": "/api/v1/books/42/",
    "path_params": [{"name": "pk", "value": 42}],
    "query_params": {},
    "headers": {},
    "body": null,
    "sandbox": true
  }
}</code></pre>

  <h3>Error Response Format</h3>
  <pre><code>{
  "error": "Sandbox execution failed: ImproperlyConfigured exception message",
  "path": "/api/v1/books/42/",
  "status_code": 500,
  "metrics": {},
  "queries": [],
  "analysis": [],
  "side_effect_warnings": [],
  "response_body": null,
  "response_size": null,
  "request": {}
}</code></pre>

  <h2>3. Connection Health Check</h2>
  <p><strong>GET</strong> <code>/profiler/connection/health</code></p>
  <p>Returns health status for the profiler and shadow database environment.</p>

  <h3>Response Format</h3>
  <pre><code>{
  "status": "ok",
  "debug": true,
  "shadow_db_configured": true,
  "shadow_db_alias": "dqs_shadow"
}</code></pre>

  <h2>Key Types Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Key Fields</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>Target</code></td>
        <td><code>id</code>, <code>kind</code> (<code>view</code> | <code>task</code> | <code>consumer</code> | <code>signal</code> | <code>static_only</code>), <code>can_execute</code>, <code>target_details</code>, <code>static_findings</code></td>
      </tr>
      <tr>
        <td><code>ProfileResult</code></td>
        <td><code>path</code>, <code>status_code</code>, <code>metrics</code>, <code>queries[]</code>, <code>analysis[]</code>, <code>error</code>, <code>side_effect_warnings</code>, <code>response_body</code>, <code>response_size</code>, <code>request</code></td>
      </tr>
      <tr>
        <td><code>Query</code></td>
        <td><code>sql</code>, <code>fingerprint</code>, <code>time_ms</code>, <code>src_loc</code> (e.g. <code>views.py:42</code>)</td>
      </tr>
      <tr>
        <td><code>N+1 Analysis</code></td>
        <td><code>fingerprint</code>, <code>count</code>, <code>src_loc</code>, <code>target_model</code>, <code>suggestion</code>, <code>sample_queries[]</code></td>
      </tr>
    </tbody>
  </table>

</body>
</html>
"""

html_path = "profiler_api_docs.html"
pdf_path = "profiler_api_docs.pdf"

with open(html_path, "w") as f:
    f.write(html_content)

HTML(filename=html_path).write_pdf(pdf_path)
print("PDF generated successfully:", pdf_path)


```

```text
PDF generated successfully: profiler_api_docs.pdf


```

Your Markdown `README.md` and document PDF have been created.

Here is the formatted **README.md** ready to copy/paste into your repository:

```markdown
# Profiler API Specification

This document provides the complete specification for the API response formats, request structures, and key data types for the Profiler service.

---

## Table of Contents
- [Endpoints Overview](#endpoints-overview)
- [Endpoints](#endpoints)
  - [1. GET /profiler/manage/routes](#1-get-profilermanageroutes)
  - [2. POST /profiler/execute](#2-post-profilerexecute)
  - [3. GET /profiler/connection/health](#3-get-profilerconnectionhealth)
- [Key Data Types Summary](#key-data-types-summary)

---

## Endpoints Overview

| Method | Endpoint | View Class | Description |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/profiler/manage/routes` | `ManageRoutesView` | Fetches available targets, route lists, counts, and static findings. |
| **`POST`** | `/profiler/execute` | `ExecuteView` | Executes live route profiling or returns static analysis. |
| **`GET`** | `/profiler/connection/health` | `ConnectionHealthView` | Checks system connection and shadow database health status. |

---

## Endpoints

### 1. GET `/profiler/manage/routes`
**View Class:** `ManageRoutesView`  
**Description:** Retrieves all targets categorized by kind along with static analysis findings and total counts.

#### Response Format
```json
{
  "targets": [
    {
      "id": "view:/api/v1/books/",
      "kind": "view",
      "can_execute": true,
      "target_details": {
        "path": "/api/v1/books/",
        "methods": ["GET", "POST"],
        "url_params": [{"name": "pk", "converter": "int"}],
        "target_model": "books.Book"
      },
      "static_findings": [
        {
          "type": "N_PLUS_ONE",
          "message": "Potential N+1: Book.objects.select_related('author')",
          "file": "views.py",
          "line": 42
        }
      ],
      "name": "/api/v1/books/",
      "methods": ["GET", "POST"],
      "path": "/api/v1/books/",
      "url_params": [{"name": "pk", "converter": "int"}]
    },
    {
      "id": "task:books.tasks.sync_covers",
      "kind": "task",
      "can_execute": true,
      "target_details": {
        "task_name": "books.tasks.sync_covers"
      },
      "static_findings": [],
      "name": "books.tasks.sync_covers"
    }
  ],
  "counts": {
    "view": 12,
    "task": 3,
    "consumer": 1
  },
  "total": 16
}

```

---

### 2. POST `/profiler/execute`

**View Class:** `ExecuteView`

**Description:** Executes target endpoint profiling or returns static findings.

> **Note:** For targets with `kind` in `("task", "consumer", "signal")`, only static analysis results are returned (no live execution).

#### Request Body Structure

| Parameter | Type | Required / Optional | Default | Description |
| --- | --- | --- | --- | --- |
| `target_id` | `string` | **Required** | — | Unique ID of the target |
| `kind` | `string` | Optional | `"view"` | Kind of target (`view`, `task`, `consumer`, `signal`) |
| `path` | `string` | Optional | — | Target route endpoint |
| `method` | `string` | Optional | `"GET"` | HTTP method |
| `path_params` | `object` | Optional | — | Path variables (e.g. `{"pk": 42}`) |
| `query_params` | `object` | Optional | — | Query parameters (e.g. `{"page": 1}`) |
| `headers` | `object` | Optional | — | Request headers |
| `body` | `object` | Optional | — | JSON request payload |
| `sandbox` | `boolean` | Optional | `true` | Run inside an isolated sandbox DB session |

#### Example Request Body

```json
{
  "target_id": "view:/api/v1/books/",
  "kind": "view",
  "path": "/api/v1/books/",
  "method": "GET",
  "path_params": { "pk": 42 },
  "query_params": { "page": 1 },
  "headers": { "Authorization": "Bearer <token>" },
  "body": { "title": "New Book" },
  "sandbox": true
}

```

#### Success Response (`ProfileResult`)

```json
{
  "path": "/api/v1/books/42/",
  "status_code": 200,
  "metrics": {
    "total_queries": 5,
    "unique_fingerprints": 3,
    "db_time_ms": 12.4,
    "n_plus_one_detected": true,
    "n_plus_one_groups": [
      {
        "fingerprint": "SELECT * FROM books_book WHERE author_id = ?",
        "count": 4,
        "src_loc": "views.py:42",
        "suggestion": "Book.objects.select_related('author')"
      }
    ]
  },
  "queries": [
    {
      "sql": "SELECT * FROM books_book WHERE id = 42",
      "fingerprint": "SELECT * FROM books_book WHERE id = ?",
      "time_ms": 1.2,
      "src_loc": "views.py:38"
    },
    {
      "sql": "SELECT * FROM books_author WHERE id = 1",
      "fingerprint": "SELECT * FROM books_author WHERE id = ?",
      "time_ms": 0.8,
      "src_loc": "views.py:42"
    }
  ],
  "analysis": [
    {
      "fingerprint": "SELECT * FROM books_author WHERE id = ?",
      "count": 4,
      "src_loc": "views.py:42",
      "target_model": "books.Author",
      "suggestion": "Book.objects.select_related('author')",
      "sample_queries": [
        {
          "sql": "SELECT * FROM books_author WHERE id = 1",
          "time_ms": 0.8,
          "src_loc": "views.py:42"
        }
      ]
    }
  ],
  "error": null,
  "side_effect_warnings": [],
  "response_body": {
    "id": 42,
    "title": "Django for APIs",
    "author": {
      "id": 1,
      "name": "William Vincent"
    }
  },
  "response_size": 156,
  "request": {
    "route": "/api/v1/books/",
    "method": "GET",
    "resolved_url": "/api/v1/books/42/",
    "path_params": [{"name": "pk", "value": 42}],
    "query_params": {},
    "headers": {},
    "body": null,
    "sandbox": true
  }
}

```

#### Error Response

```json
{
  "error": "Sandbox execution failed: ImproperlyConfigured exception message",
  "path": "/api/v1/books/42/",
  "status_code": 500,
  "metrics": {},
  "queries": [],
  "analysis": [],
  "side_effect_warnings": [],
  "response_body": null,
  "response_size": null,
  "request": {}
}

```

---

### 3. GET `/profiler/connection/health`

**View Class:** `ConnectionHealthView`

**Description:** Health check endpoint to confirm profiler readiness and shadow database status.

#### Response Format

```json
{
  "status": "ok",
  "debug": true,
  "shadow_db_configured": true,
  "shadow_db_alias": "dqs_shadow"
}

```

---

## Key Data Types Summary

| Type | Key Fields |
| --- | --- |
| **`Target`** | `id`, `kind` (`view` | `task` | `consumer` | `signal` | `static_only`), `can_execute`, `target_details`, `static_findings` |
| **`ProfileResult`** | `path`, `status_code`, `metrics`, `queries[]`, `analysis[]`, `error`, `side_effect_warnings`, `response_body`, `response_size`, `request` |
| **`Query`** | `sql`, `fingerprint`, `time_ms`, `src_loc` (e.g. `views.py:42`) |
| **`N+1 Analysis`** | `fingerprint`, `count`, `src_loc`, `target_model`, `suggestion`, `sample_queries[]` |

```
---