# 💻 DevFlow Client

The frontend application for DevFlow, built with React and ReactFlow for a seamless visual logic building experience.

## 🚀 Technologies

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Visual Canvas**: [ReactFlow](https://reactflow.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Animations**: [GSAP](https://greensock.com/gsap/)
- **Real-time**: [Socket.io-client](https://socket.io/)

## 🛠️ Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 📂 Structure

- `src/components`: UI components and workflow nodes.
- `src/hooks`: Custom React hooks for execution and state.
- `src/store`: Zustand stores for workflow state.
- `src/services`: API and Socket service layers.
- `src/pages`: Main application views (Dashboard, Canvas, Login).

## 🌐 API Configuration

The client connects to the backend at `http://localhost:5000/api` by default. This can be configured in `src/services/api.ts`.
