# 🚀 DevFlow: Visual API Automation Platform

DevFlow is a premium, high-performance platform designed to automate complex API workflows through a powerful visual logic builder. Built for developers who want to streamline integration processes without getting bogged down in boilerplate code.

![DevFlow Banner](https://img.shields.io/badge/DevFlow-Visual%20Logic-blueviolet?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

---

## ✨ Key Features

- **🎨 Visual Workflow Builder**: drag-and-drop interface powered by `ReactFlow` to design logic flows.
- **⚡ Real-time Execution**: Watch your workflows execute in real-time with `Socket.io` integration.
- **🏢 Workspace Management**: Organize your automation scripts into logical workspaces.
- **🕒 Background Processing**: Reliable job execution using `BullMQ` and `Redis`.
- **🔐 Secure Authentication**: Robust user management with JWT and encrypted sessions.
- **🤖 AI-Ready**: Integrated support for `OpenAI` to inject intelligence into your flows.

---

## 🛠️ Technology Stack

### Frontend (`devflow-client`)
- **Core**: React 19 + TypeScript + Vite
- **Canvas**: ReactFlow
- **Styling**: TailwindCSS 4
- **Animations**: GSAP
- **State Management**: Zustand
- **Networking**: Axios + Socket.io-client

### Backend (`devflow-server`)
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Caching & Queues**: Redis + BullMQ
- **Real-time**: Socket.io
- **Security**: JWT + BcryptJS

---

## 📂 Project Structure

```text
DevFlow/
├── devflow-client/        # React application (Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI elements
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Application views
│   │   └── store/         # Zustand state management
├── devflow-server/        # Express API & Workers
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database schemas
│   │   ├── services/      # Business logic & Job queues
│   │   └── sockets/       # Real-time event handlers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Redis Server (Running on localhost:6379 or provide URL)

### 1. Clone & Install
```bash
# Install Client Dependencies
cd devflow-client
npm install

# Install Server Dependencies
cd ../devflow-server
npm install
```

### 2. Environment Setup
Create a `.env` file in the `devflow-server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://127.0.0.1:6379
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_key
```

### 3. Run the Project
Open two terminals:

**Terminal 1 (Server):**
```bash
cd devflow-server
npm run dev
```

**Terminal 2 (Client):**
```bash
cd devflow-client
npm run dev
```

---

## 🛡️ License

This project is licensed under the ISC License.

---

<p align="center">
  Built with ❤️ for the Developer Community
</p>
