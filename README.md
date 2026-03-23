# 🖥 System Process Manager

> Real-time OS process monitoring dashboard built with Node.js, React and WebSockets.

![Stack](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Stack](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)
![Stack](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Jest_%2B_Vitest-C21325?logo=jest&logoColor=white)

---

## ✨ Features

- **Real-time metrics** — CPU load (total, user, system, per-core) and RAM usage streamed via WebSocket every 2 seconds
- **Gauge charts** — semi-circular Recharts gauges with colour-coded thresholds (green → amber → red)
- **Trend chart** — 2-minute scrolling area chart for both CPU and memory
- **Process table** — sortable by CPU usage, searchable by name, PID, or command
- **Resilient collection** — `Promise.allSettled` ensures a single failing OS call never crashes the whole cycle
- **Graceful shutdown** — `SIGTERM`/`SIGINT` handlers drain connections cleanly
- **Unit tested** — 20 backend tests (Jest) + 14 frontend tests (Vitest + RTL)

---

## 🏗 Architecture

```
system-process-manager/
│
├── backend/                        # Node.js API + WebSocket server
│   └── src/
│       ├── server.js               # Entry point — HTTP + Socket.IO bootstrap
│       ├── app.js                  # Express factory (CORS, health route, error handler)
│       ├── controllers/
│       │   └── socketController.js # Broadcast loop; starts/stops with client count
│       ├── services/
│       │   └── metricsService.js   # Collects OS data; isolates failures per source
│       └── parsers/
│           └── systemParser.js     # Pure functions — clamp, convert, map raw → domain
│
└── frontend/                       # React + Vite SPA
    └── src/
        ├── App.jsx                 # Root layout — composes all sections
        ├── hooks/
        │   └── useSystemStats.js   # Socket lifecycle + useReducer state machine
        └── components/
            ├── dashboard/
            │   ├── GaugeChart.jsx  # Recharts PieChart rendered as gauge
            │   └── TrendChart.jsx  # Recharts AreaChart for historical data
            ├── processes/
            │   └── ProcessTable.jsx # Searchable process list (client-side filter)
            └── ui/
                └── StatCard.jsx    # Reusable metric pill
```

### Key design decisions

| Decision | Rationale |
|---|---|
| **Parsers as pure functions** | Zero I/O → trivially unit-testable without mocking |
| **`Promise.allSettled` in metricsService** | CPU, memory and process calls are independent; one failure should not blank the dashboard |
| **`useReducer` in the hook** | Explicit state machine makes all connection transitions auditable |
| **Broadcast only when clients connected** | `setInterval` starts on first connect and stops when count reaches zero — saves CPU on idle server |
| **ES Modules throughout** | Consistent `import`/`export` syntax in both Node (type: "module") and Vite |

---

## 🚀 Quick start

### Prerequisites

- **Node.js ≥ 20** (uses `--watch` flag and native ESM)
- **Linux** recommended (systeminformation has full support; macOS works but some fields differ)

### 1 — Install dependencies

```bash
# From the repo root:
npm run install:all

# Or individually:
cd backend  && npm install
cd frontend && npm install
```

### 2 — Configure environment (optional)

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

Edit `.env` files if your ports differ from the defaults (`3001` / `5173`).

### 3 — Run in development mode

Open **two terminals**:

```bash
# Terminal 1 — backend (auto-restarts on file change)
cd backend && npm run dev

# Terminal 2 — frontend (Vite HMR)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4 — Run tests

```bash
# All tests from root
npm test

# Backend only (Jest, with coverage)
cd backend && npm test

# Frontend only (Vitest, with coverage)
cd frontend && npm test
```

### 5 — Production build

```bash
# Build the frontend SPA
npm run build          # outputs to frontend/dist/

# Start the backend in production
cd backend && npm start
```

Serve `frontend/dist/` with any static host (Nginx, Caddy, Vercel) and point `VITE_BACKEND_URL` to your production backend.

---

## 🔌 WebSocket API

The backend emits two events on the `system:snapshot` and `system:error` channels.

### `system:snapshot` payload

```jsonc
{
  "timestamp": 1718000000000,
  "cpu": {
    "total": 23.5,      // overall CPU %
    "user": 15.2,       // user-space %
    "system": 8.3,      // kernel %
    "cores": [28, 19]   // per-core %
  },
  "memory": {
    "totalMiB": 16384,
    "usedMiB":  8192,
    "freeMiB":  8192,
    "usedPercent": 50.0
  },
  "processes": [
    {
      "pid": 1234,
      "name": "node",
      "cpu": 12.3,
      "memMiB": 140.2,
      "state": "S",
      "command": "node server.js"
    }
  ]
}
```

### `system:error` payload

```jsonc
{ "message": "Failed to collect metrics." }
```

---

## 🧪 Test coverage highlights

### Backend (Jest)

| Module | Tests |
|---|---|
| `clampPercent` | handles NaN, null, >100, <0, rounding |
| `bytesToMiB` | 0, negative, exact GiB, rounding |
| `parseCpuLoad` | null input, full payload, missing cores, clamping |
| `parseMemory` | null input, correct %, division-by-zero guard |
| `parseProcessList` | null, empty, mapping, sort order, truncation, falsy filter |

### Frontend (Vitest + React Testing Library)

| Module | Tests |
|---|---|
| `ProcessTable` | render all, count badge, filter by name/PID, no-match message, state colours |
| `useSystemStats` | initial state, connect, snapshot, history accumulation, disconnect, error, unmount cleanup |

---

## 📦 Tech stack

| Layer | Library | Version |
|---|---|---|
| Runtime | Node.js | ≥ 20 |
| HTTP server | Express | ^4.18 |
| WebSocket | Socket.IO | ^4.7 |
| OS metrics | systeminformation | ^5.22 |
| Frontend bundler | Vite | ^5 |
| UI library | React | ^18.3 |
| Styling | Tailwind CSS | ^3.4 |
| Charts | Recharts | ^2.12 |
| Icons | Lucide React | ^0.383 |
| WS client | socket.io-client | ^4.7 |
| Backend tests | Jest | ^29.7 |
| Frontend tests | Vitest + RTL | ^1.6 |

---

## 📄 License

MIT © 2024
