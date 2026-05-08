# ⚙️ DevFlow Server

The backend API and execution engine for DevFlow, powered by Node.js, Express, and BullMQ.

## 🚀 Technologies

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Queue System**: [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)
- **Real-time**: [Socket.io](https://socket.io/)
- **AI**: [OpenAI SDK](https://github.com/openai/openai-node)

## 🛠️ Getting Started

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file with the following:
- `PORT`: Server port (default 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT
- `REDIS_URL`: Redis connection URL
- `OPENAI_API_KEY`: OpenAI API key for AI nodes

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📂 Structure

- `src/controllers`: Request handlers for API endpoints.
- `src/models`: Mongoose schemas for Workflows, Executions, and Users.
- `src/services`: Core logic, including the `ExecutionService` and BullMQ workers.
- `src/sockets`: Socket.io event logic for real-time workflow tracking.
- `src/types`: TypeScript interfaces and types.
