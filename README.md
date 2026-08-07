<div align="center">
  <img src="https://img.shields.io/badge/DevFlow-Visual%20API%20Orchestration-6366f1?style=for-the-badge&logoColor=white" alt="DevFlow" />
  
  <br />
  <br />

  <p>
    <b>A visual drag-and-drop API workflow orchestration studio.</b><br/>
    <i>Design, chain, execute, and benchmark API workflows on an infinite canvas.<br/>Think Postman meets n8n, built entirely from scratch.</i>
  </p>

  <p>
    <a href="https://devflowapi.netlify.app/">Live Demo</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#features">Features</a>
  </p>
</div>

---

## ⚡ Tech Stack

<div align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/BullMQ-5-FF6B6B?style=flat-square" />
</div>

---

## 🚀 Features

### 🎨 Visual Orchestration
- **Infinite Canvas:** Drag-and-drop React Flow interface.
- **Undo/Redo:** Full history tracking (`Ctrl+Z` / `Ctrl+Shift+Z`).
- **Live Status:** Real-time visual feedback (idle, running, success, error).

### 🛠️ Postman-like Editor
- **Rich Configs:** Dynamic URLs (`{{BASE_URL}}/path`), query params, headers, and advanced Auth.
- **JSONPath Mapping:** Visually pipe upstream responses directly into downstream requests.
- **AI Generation:** Describe your API call in plain English, and the AI builds the configuration.

### 🔄 Automation & Logic
- **Webhook Triggers:** Generate unique webhook URLs to trigger your workflows from external services. Includes URL regeneration and pausing.
- **Conditional Logic:** Route executions dynamically based on upstream responses and complex operators (eq, contains, gt, lt).

### ⚡ Execution & Load Testing
- **DAG Engine:** Topological sorting (Kahn's Algorithm) for parallel and sequential execution.
- **Real Virtual Users:** Run live HTTP load tests against your APIs.
- **Advanced Metrics:** Live throughput (req/sec) and p50/p95/p99 latency percentiles.

---

## 🧠 System Architecture

<details>
<summary><b>Click to expand architecture & engineering decisions</b></summary>
<br/>

**BullMQ & Socket.io**
Executions are enqueued into a Redis-backed BullMQ queue and processed by isolated workers. Live logs are streamed via Socket.io for a real-time, animated canvas experience without blocking the HTTP thread.

**Redis Middleware**
Uses SHA-256 hashes for 5-minute request caching (0ms hit times) and atomic `INCR` sliding windows for enterprise-grade rate limiting (e.g., 100 req/hr per IP).

**DAG Engine**
Powered by Kahn's Algorithm to build execution levels. Independent nodes in the same level run simultaneously using `Promise.all()` to maximize throughput.

```text
CLIENT (React + Zustand + ReactFlow) 
  │ 
  ├─ WebSocket ──▶ Socket.io (Live Updates)
  └─ REST ───────▶ Express API
                      │
                      ▼
                   BullMQ (Redis Queue)
                      │
                      ▼
            Node.js Worker (DAG Engine) ──▶ MongoDB
```
</details>

---

## 💻 Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/devflow.git
   cd devflow
   ```

2. **Backend Setup**
   ```bash
   cd devflow-server
   cp .env.example .env
   npm install
   npm run dev
   
   # Run the worker in a separate terminal:
   npm run worker 
   ```

3. **Frontend Setup**
   ```bash
   cd ../devflow-client
   cp .env.example .env
   npm install
   npm run dev
   ```

### 🐳 Docker Alternative

Run the entire stack instantly via Docker Compose:

```bash
docker-compose up --build
```
