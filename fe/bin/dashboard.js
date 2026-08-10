#!/usr/bin/env node
import process from "process";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname } from "path";
import open from "open";
import sirv from "sirv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const distDir = join(projectRoot, "dist");

const PORT = 5173;
const HOST = "0.0.0.0";

// MIME types for static files
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

async function serveStaticFile(req, res, filePath) {
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { "Content-Type": getMimeType(filePath) });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}

// Check if dist directory exists
if (!existsSync(distDir)) {
  console.error("❌ Build directory not found. Run 'npm run build' first.");
  console.error(`Expected: ${distDir}`);
  process.exit(1);
}

console.log("🚀 Da Profiler Dashboard starting...");
console.log(`📍 Frontend: http://localhost:${PORT}`);
console.log(`📂 Serving: ${distDir}`);
console.log("");

// Use sirv for SPA routing (falls back to index.html for client-side routes)
const serve = sirv(distDir, {
  dev: false,
  single: true, // SPA fallback to index.html
  etag: true,
  maxAge: 31536000, // 1 year cache for assets
  immutable: true,
  setHeaders: (res, pathname) => {
    // Disable cache for HTML
    if (pathname.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  },
});

const server = createServer((req, res) => {
  // Add CORS headers for local development
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRFToken");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  serve(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);

  // Open browser after brief delay
  setTimeout(() => {
    open(`http://localhost:${PORT}`).catch(() => {
      console.log(
        `⚠️  Could not open browser automatically. Please open http://localhost:${PORT} manually.`,
      );
    });
  }, 1500);
});

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down Da Profiler Dashboard...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Try: lsof -ti:${PORT} | xargs kill`);
  } else {
    console.error("❌ Server error:", err.message);
  }
  process.exit(1);
});