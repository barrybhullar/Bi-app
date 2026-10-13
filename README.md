# 🎮 Bi Desk — Ultra-Low Latency Remote Desktop & Cloud Gaming (Parsec Clone)

Bi Desk is a high-performance, ultra-low latency remote desktop and cloud gaming platform modeled after Parsec. Engineered for real-time interactive tasks, 60-120 FPS high refresh-rate streaming, and seamless cross-platform performance across macOS and Windows.

---

## 📁 Repository Structure

```
Bi-app/
├── client/                     # React 18 + Vite + Tailwind Client & Tauri Native App
│   ├── src/                    # Frontend React source code
│   │   ├── components/         # HUD overlay, Display switcher, Modals
│   │   ├── App.tsx             # Main client application
│   │   ├── webrtc.ts           # Ultra-low latency WebRTC P2P stream engine
│   │   └── supabase.ts         # Supabase client & presence signaling
│   └── src-tauri/              # Tauri v2 native engine (Rust / Metal / DXGI)
├── docs/                       # Project Documentation & Architecture (Vibe Coding)
│   ├── PRD.md                  # Product requirements & MVP scope
│   ├── ARCHITECTURE.md         # System structure, pipeline, & invariants
│   ├── DESIGN.md               # Visual design system & UX states
│   ├── RULES.md                # Security rules & technical constraints
│   ├── TASKS.md                # Phased development checklist
│   ├── DECISIONS.md            # Architecture Decision Records (ADRs)
│   ├── MEMORY.md               # Live project memory & milestone tracking
│   ├── TEST_PLAN.md            # Automated & manual test suites
│   └── SECURITY.md             # RBAC & access control specifications
├── landing-page/               # Marketing portal, download page, admin controls
├── host-service/               # Headless pre-login host service daemon
├── supabase/                   # Database schema, RLS policies, Realtime signaling
├── scripts/                    # Automation scripts (packaging, installers)
└── README.md
```

---

## 🚀 Running the Client & WebRTC Stream

```bash
cd client
npm install
npm run dev
```
The client GUI runs at `http://localhost:3000` (or `http://localhost:5173`).

To launch as a native desktop application with hardware capture:
```bash
cd client
npm run tauri dev
```
