<p align="center">
  <img src="https://img.shields.io/badge/DevFlow-Visual%20API%20Orchestration-6366f1?style=for-the-badge&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/BullMQ-5-FF6B6B?style=flat-square" />
  <img src="https://img.shields.io/badge/Docker-24-2496ED?style=flat-square&logo=docker&logoColor=white" />
</p>

<p align="center">
  <strong>A visual drag-and-drop API workflow orchestration studio. Design, chain, and execute API workflows on an infinite canvas — like Postman meets n8n, built from scratch.</strong>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [System Design](#system-design)
- [Benchmark Results](#benchmark-results)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Key Engineering Decisions](#key-engineering-decisions)
- [Interview Talking Points](#interview-talking-points)

---

## Overview

DevFlow is a full-stack visual API orchestration platform where developers can:

- Design API workflows on an **infinite drag-and-drop canvas**
- **Chain API calls** — pipe response fields from one node directly into the next request
- **Execute workflows** and watch live results stream through each node in real time
- **Debug failures** at the exact node where they occur with full request/response details
- **Cache results** automatically so repeated runs are near-instant
- **Test complex flows** with parallel branches, retries, and field mapping — all in one click

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://devflow-studio.netlify.app |
| Backend API | https://devflow-api.onrender.com |
| Health Check | https://devflow-api.onrender.com/health |

---

## Features

### Canvas
- Infinite pan/zoom canvas powered by React Flow
- Drag nodes from library onto canvas
- Connect nodes by dragging handles
- Animated edges showing data flow direction
- Node status: idle (grey) / running (blue pulse) / success (green glow) / error (red glow)
- Delete nodes/edges with keyboard
- MiniMap for navigation
- Select and move multiple nodes

### Node Panel (Postman-like Editor)
- **Config tab** — full request configuration
  - AI-powered API generation — describe what you want, AI writes the call
  - HTTP method selector (GET, POST, PUT, DELETE, PATCH)
  - URL with environment variable support (`{{BASE_URL}}/users`)
  - Query params editor with live URL preview
  - Authorization helpers — Bearer Token, Basic Auth, API Key (header or query)
  - Headers editor (key-value pairs)
  - Body types — JSON, Form Data, File Upload (base64 encoded)
- **Response tab** — full response inspection
  - HTTP status badge (200 green, 4xx amber, 5xx red)
  - Execution time and response size
  - Cache indicator (⚡ cached)
  - Retry count badge
  - Pretty-printed JSON with syntax highlighting
  - Raw response toggle
  - Collapsible response headers
- **Mappings tab** — JSONPath field mapper
  - Map response fields from any previous node
  - Inject into URL, body fields, or headers
  - Visual preview of the mapping

### Execution Engine
- **DAG execution** using topological sort (Kahn's algorithm)
- **Parallel execution** — independent nodes run simultaneously using `Promise.all`
- **Sequential chaining** — dependent nodes wait for upstream results
- **Per-node retry** with exponential backoff (1s → 2s → 4s)
- **Timeout** per node (15 seconds)
- **Continue-on-failure** — marks failed node, continues rest of graph

### Job Queue (BullMQ)
- All workflow executions enqueued in Redis-backed BullMQ queue
- Separate worker process with configurable concurrency (5 parallel jobs)
- Automatic retry on worker crash — jobs resume on restart
- Dead Letter Queue — failed jobs preserved after max retries
- Idempotency — duplicate run requests return existing execution

### Real-time Streaming (Socket.io)
- WebSocket connection per workflow session
- Room-based isolation — each workflow gets its own Socket.io room
- Live node status updates streamed as execution progresses
- Live execution log drawer with timestamps and per-node timing

### Caching (Redis)
- SHA256 hash of (URL + method + headers + body) as cache key
- 5-minute TTL on cached responses
- Cache hit returns result in 0ms — skips the real HTTP call
- Cache indicator shown in node response panel and execution log

### Rate Limiting (Redis)
- Auth routes — 10 attempts per 15 minutes per IP (brute force protection)
- Execution routes — 100 runs per hour per IP
- AI generation — 20 requests per hour per IP
- Global API — 300 requests per minute per IP
- Sliding window algorithm using Redis INCR + EXPIRE
- Rate limit headers returned on every response (`X-RateLimit-Remaining`)

### Environment Variables
- Define reusable variables like `BASE_URL`, `TOKEN`, `API_KEY`
- Reference with `{{VARIABLE_NAME}}` syntax in any URL, header, or body
- Resolved at execution time — stored nodes keep template syntax
- Clickable chips in URL editor for quick insertion

### Other Features
- **Command Palette** — `Cmd+K` spotlight search for all actions
- **Execution History** — last 20 runs with per-node timing and status
- **Node Templates** — pre-built workflow starters (Auth Flow, Data Chain, Parallel Fetch)
- **Export/Import** — download/upload workflows as JSON
- **Benchmark** — run 20 concurrent executions, see latency chart with avg/min/max
- **AI Node** — describe an API call in plain English, GPT-4o-mini generates the config

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Canvas  │  │  Node    │  │ Sidebar  │  │   Navbar     │   │
│  │(ReactFlow│  │  Panel   │  │(Library  │  │(Run/Save/Env)│   │
│  │  DAG)    │  │(Postman  │  │Templates)│  │              │   │
│  │          │  │  -like)  │  │          │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Zustand Store                        │   │
│  │    nodes | edges | selectedNode | workflowId | envVars  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────┐         ┌────────────────────────────┐   │
│  │   Socket.io      │         │       Axios API Client     │   │
│  │  (live updates)  │         │  (JWT interceptor + retry) │   │
│  └──────────────────┘         └────────────────────────────┘   │
└───────────────────────────┬─────────────────────┬─────────────┘
                            │ WebSocket            │ HTTP/REST
                            │                      │
┌───────────────────────────┴──────────────────────┴─────────────┐
│                      API SERVER (Express)                       │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐   │
│  │    Auth    │  │  Workflow  │  │Execution │  │    AI    │   │
│  │  /register │  │   CRUD    │  │  /run    │  │/generate │   │
│  │  /login    │  │  /save    │  │  /history│  │          │   │
│  └────────────┘  └────────────┘  └──────────┘  └──────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Middleware Stack                      │   │
│  │   JWT Auth | Rate Limiter | CORS | JSON Body Parser     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Socket.io Server                     │   │
│  │         Room-based isolation per workflow ID            │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────────┘
                        │ Enqueue Job
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                    BULLMQ QUEUE (Redis)                       │
│                                                               │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│   │ Waiting │ →  │ Active  │ →  │Completed│    │ Failed  │  │
│   │  jobs   │    │  jobs   │    │  (100)  │    │  (DLQ)  │  │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
└───────────────────────┬───────────────────────────────────────┘
                        │ Process Job
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                   WORKER PROCESS (Node.js)                    │
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │              DAG Execution Engine                     │   │
│   │                                                       │   │
│   │  Topological Sort (Kahn's Algorithm)                  │   │
│   │  ┌─────────┐                                          │   │
│   │  │ Level 1 │  Node A  (no dependencies)               │   │
│   │  └────┬────┘                                          │   │
│   │       │                                               │   │
│   │  ┌────┴────┐                                          │   │
│   │  │ Level 2 │  Node B → Node C  (parallel)             │   │
│   │  └────┬────┘  Promise.all([B, C])                     │   │
│   │       │                                               │   │
│   │  ┌────┴────┐                                          │   │
│   │  │ Level 3 │  Node D  (depends on B and C)            │   │
│   │  └─────────┘                                          │   │
│   │                                                       │   │
│   │  Per-node:                                            │   │
│   │  1. Resolve field mappings (JSONPath)                 │   │
│   │  2. Apply auth (Bearer/Basic/APIKey)                  │   │
│   │  3. Build query params                                │   │
│   │  4. Check Redis cache (SHA256 hash)                   │   │
│   │  5. Execute HTTP request (axios)                      │   │
│   │  6. Retry with exponential backoff on failure         │   │
│   │  7. Cache result in Redis (5min TTL)                  │   │
│   │  8. Emit node_update via Socket.io                    │   │
│   └───────────────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
┌──────────────────┐        ┌──────────────────────┐
│     MongoDB      │        │        Redis          │
│                  │        │                       │
│  users           │        │  BullMQ queues        │
│  workflows       │        │  Execution cache      │
│  executions      │        │  Rate limit counters  │
└──────────────────┘        └──────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool |
| React Flow | 11 | Canvas engine |
| Zustand | 4 | State management |
| Tailwind CSS | 3 | Styling |
| Axios | 1 | HTTP client |
| Socket.io-client | 4 | WebSocket client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 | Runtime |
| Express | 4 | HTTP server |
| TypeScript | 5 | Type safety |
| MongoDB + Mongoose | 7 | Primary database |
| Redis (ioredis) | 7 | Cache + queue |
| BullMQ | 5 | Job queue |
| Socket.io | 4 | WebSocket server |
| JWT | 9 | Authentication |
| bcryptjs | 2 | Password hashing |
| OpenAI | 4 | AI node generation |
| axios | 1 | HTTP execution |
| form-data | 4 | Multipart uploads |
| jsonpath | 1 | Field mapping |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker + Docker Compose | Containerization |
| Render | Backend hosting |
| Netlify | Frontend hosting |
| MongoDB Atlas | Managed database |
| Redis Cloud | Managed Redis |

---

## System Design

### DAG Execution — Topological Sort (Kahn's Algorithm)

Workflows are Directed Acyclic Graphs. Nodes must execute in dependency order.

```
Algorithm:
1. Build in-degree map for all nodes
2. Queue all nodes with in-degree 0 (no dependencies)
3. Group nodes at same depth into execution levels
4. Run each level with Promise.all() for parallelism
5. After level completes, decrement neighbors' in-degree
6. Repeat until all nodes processed

Time complexity: O(V + E)
Space complexity: O(V)
```

Example:
```
Workflow:  A → B → D
           A → C → D

Level 0: [A]          — runs first
Level 1: [B, C]       — runs in parallel (Promise.all)
Level 2: [D]          — runs after both B and C complete
```

### Job Queue Architecture

```
HTTP Request → API Server → BullMQ.add(job) → HTTP Response (immediate)
                                  ↓
                            Redis Queue
                                  ↓
                          Worker.process(job)
                                  ↓
                         Socket.io.emit(updates)
                                  ↓
                           Client receives
                           live node updates
```

**Why decouple execution from HTTP:**
- API responds immediately — no request timeout issues
- Worker crashes don't affect API server
- Horizontal scaling — add more workers independently
- Built-in retry on failure
- Job persistence — survives server restarts

### Idempotency

Every run request includes an idempotency key (UUID generated client-side).

```
POST /api/execution/:id/run
Headers: X-Idempotency-Key: <uuid>

Flow:
1. Check MongoDB for existing execution with this key
2. If found → return existing executionId (no duplicate run)
3. If not found → create execution record → enqueue job
```

**Prevents:** Double-click runs, network retry duplicates, browser refresh mid-run.

### Redis Caching Strategy

```
Cache Key: SHA256(method + url + headers + body)
TTL: 5 minutes
Storage: Redis string (JSON serialized)

On execution:
1. Compute hash of node config
2. GET cache:node:<hash>
3. If hit → return cached, emit fromCache: true
4. If miss → execute HTTP, SET cache:node:<hash> EX 300

Benchmark result:
- Cold run (no cache): ~2700ms for 8 nodes
- Warm run (all cached): ~193ms for 8 nodes
- Improvement: 93% latency reduction
```

### Rate Limiting — Sliding Window

```
Algorithm: Redis INCR + EXPIRE (atomic pipeline)

Per request:
1. INCR ratelimit:<prefix>:<identifier>
2. TTL ratelimit:<prefix>:<identifier>
3. If TTL == -1 → EXPIRE key <window_seconds>
4. If count > limit → return 429

Limits:
- Auth:      10 req / 15 min / IP  (brute force protection)
- Execution: 100 req / 1 hr / IP
- AI:        20 req / 1 hr / IP
- Global:    300 req / 1 min / IP
```

### Multi-tenant Data Isolation

Every database query filters by both `_id` AND `userId`:

```typescript
// Never just findById — always scope to user
Workflow.findOne({ _id: req.params.id, userId: req.user.id })
```

User A cannot read, modify, or delete User B's workflows even with a known ID.

### JSONPath Field Mapping

```
Scenario:
- Node A: GET /users/1 → { id: 1, name: "John", email: "john@example.com" }
- Node B: POST /orders  ← inject userId from Node A

Config:
- Source node: Node A
- JSONPath: $.id
- Target: body.userId

Resolution at runtime:
1. results["nodeA"] = { id: 1, name: "John", ... }
2. jsonpath.query(results["nodeA"], "$.id") → [1]
3. Parse Node B body JSON
4. Set body.userId = 1
5. Execute Node B with injected value
```

---

## Benchmark Results

**Test configuration:**
- 20 concurrent workflow executions
- 8-node workflow (4 levels, 2 parallel branches)
- Mixed GET and POST requests
- JSONPlaceholder API as target

**Results:**

| Metric | Value |
|--------|-------|
| Cold run (no cache) | ~2700ms |
| Warm run (all cached) | ~193ms |
| Cache improvement | 93% |
| Avg node latency | ~140ms |
| Min node latency | ~88ms |
| Max node latency | ~1200ms |
| Success rate (20 runs) | 100% |
| Queue throughput | 5 concurrent jobs |

**Parallel execution benefit:**
```
Sequential (8 nodes): ~2700ms
Parallel (level 2 + 3 run together): saves ~800ms per run
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7+
- Redis 7+
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/devflow.git
cd devflow
```

### 2. Setup Backend

```bash
cd devflow-server
npm install
cp .env.example .env
# Fill in your environment variables
npm run dev
```

### 3. Start the Worker (separate terminal)

```bash
cd devflow-server
npm run worker
```

### 4. Setup Frontend

```bash
cd devflow-client
npm install
npm run dev
```

### 5. Open in browser

```
http://localhost:5173
```

---

## Environment Variables

### Backend (`devflow-server/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/devflow

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173

# AI
OPENAI_API_KEY=sk-your-openai-key-here
```

### Frontend (`devflow-client/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## Docker Setup

### Development

```bash
# Start all services
docker-compose up --build

# Start specific service
docker-compose up mongo redis

# View logs
docker-compose logs -f api
docker-compose logs -f worker
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### `docker-compose.yml`

```yaml
version: '3.9'

services:
  mongo:
    image: mongo:7
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: devflow

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  api:
    build:
      context: ./devflow-server
      dockerfile: Dockerfile
    restart: always
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/devflow
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_URL=${CLIENT_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - mongo
      - redis

  worker:
    build:
      context: ./devflow-server
      dockerfile: Dockerfile.worker
    restart: always
    environment:
      - MONGODB_URI=mongodb://mongo:27017/devflow
      - REDIS_URL=redis://redis:6379
      - CLIENT_URL=${CLIENT_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - mongo
      - redis
      - api

  client:
    build:
      context: ./devflow-client
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  mongo_data:
  redis_data:
```

---

## API Reference

### Auth

```
POST   /api/auth/register     Register new user
POST   /api/auth/login        Login
GET    /api/auth/me           Get current user (JWT required)
```

### Workflows

```
GET    /api/workflows          List user workflows
GET    /api/workflows/:id      Get single workflow
POST   /api/workflows          Create workflow
PUT    /api/workflows/:id      Update workflow
DELETE /api/workflows/:id      Delete workflow
```

### Execution

```
POST   /api/execution/:workflowId/run           Run workflow
GET    /api/execution/:workflowId/history       Get execution history
GET    /api/execution/detail/:executionId       Get execution detail
```

### AI

```
POST   /api/ai/generate        Generate API config from description
```

### WebSocket Events

```
Client → Server:
  join_workflow <workflowId>    Join workflow room for updates
  leave_workflow <workflowId>   Leave workflow room

Server → Client:
  execution_start               Workflow started
  node_update                   Node status changed
    { nodeId, status, response, error, executionTime,
      statusCode, responseHeaders, fromCache, retryCount }
  execution_complete            Workflow finished
    { status, totalTime }
  execution_error               Rate limit or fatal error
    { message }
```

---

## Project Structure

```
devflow/
├── devflow-client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   └── FlowCanvas.tsx  # React Flow canvas
│   │   │   ├── nodes/
│   │   │   │   └── ApiNode.tsx     # Custom node component
│   │   │   └── ui/
│   │   │       ├── Navbar.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── NodePanel.tsx   # Postman-like editor
│   │   │       ├── FieldMapper.tsx # JSONPath mapper
│   │   │       ├── ExecutionLog.tsx
│   │   │       ├── ExecutionHistory.tsx
│   │   │       ├── CommandPalette.tsx
│   │   │       └── EnvPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useExecution.ts
│   │   │   └── useSocketEvents.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── BenchmarkPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── workflowService.ts
│   │   │   └── socketService.ts
│   │   ├── store/
│   │   │   ├── flowStore.ts
│   │   │   └── authStore.ts
│   │   └── types/
│   │       └── index.ts
│   ├── Dockerfile
│   └── package.json
│
└── devflow-server/                 # Node.js backend
    ├── src/
    │   ├── config/
    │   │   ├── database.ts         # MongoDB connection
    │   │   ├── redis.ts            # Redis connection
    │   │   └── queue.ts            # BullMQ setup
    │   ├── controllers/
    │   │   ├── authController.ts
    │   │   └── workflowController.ts
    │   ├── middleware/
    │   │   ├── auth.ts             # JWT middleware
    │   │   └── rateLimits.ts       # Redis rate limiting
    │   ├── models/
    │   │   ├── User.ts
    │   │   ├── Workflow.ts
    │   │   └── Execution.ts
    │   ├── routes/
    │   │   ├── auth.ts
    │   │   ├── workflows.ts
    │   │   ├── execution.ts
    │   │   └── ai.ts
    │   ├── services/
    │   │   ├── executionService.ts # Core DAG engine
    │   │   ├── executionCache.ts   # Redis caching
    │   │   ├── rateLimiter.ts      # Rate limiting
    │   │   └── aiService.ts        # OpenAI integration
    │   ├── types/
    │   │   ├── index.ts
    │   │   └── jobs.ts
    │   ├── utils/
    │   │   └── jsonpath.ts
    │   ├── index.ts                # API server entry
    │   └── worker.ts               # BullMQ worker entry
    ├── Dockerfile
    ├── Dockerfile.worker
    └── package.json
```

---

## Key Engineering Decisions

### Why BullMQ over direct execution?

Direct execution inside Express would block the request thread and fail under load. BullMQ decouples execution — the API responds immediately and the worker processes asynchronously. If the worker crashes, jobs persist in Redis and resume automatically. This also enables horizontal scaling by adding more worker instances.

### Why Socket.io over HTTP polling?

HTTP polling for execution status would require clients to poll every ~500ms — wasteful and slow. Socket.io maintains a persistent WebSocket connection. The server pushes updates in real time (< 10ms latency) the moment a node finishes. This enables the live animated execution experience.

### Why Kahn's Algorithm for topological sort?

Kahn's is BFS-based and naturally produces execution levels — all nodes at the same depth are independent and can run in parallel. A DFS-based sort gives order but not levels. The level structure maps directly to `Promise.all` batches in the execution engine.

### Why Redis for both cache and rate limiting?

Redis operations are O(1) and sub-millisecond. INCR is atomic — no race conditions in rate limiting even under concurrent requests. Using one Redis instance for queue, cache, and rate limiting reduces operational complexity without performance trade-offs.

### Why Zustand over Redux?

DevFlow's state (nodes, edges, selected node, workflow metadata) is a single flat object with simple update patterns. Zustand handles this in ~50 lines with no boilerplate. Redux would add 200+ lines of actions, reducers, and selectors for the same result.

### Why SHA256 for cache keys?

The cache key must uniquely identify an API request configuration. SHA256 of (method + URL + headers + body) produces a fixed-length deterministic key. Two nodes with identical configs produce the same hash and share cache entries, even across different workflows or users.

---


## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ using React, Node.js, Redis, MongoDB, BullMQ, and Socket.io
</p>
