# System Architecture: Bi Desk (Parsec Ultra-Low Latency Replica)

## 1. High-Level Architecture Overview

Bi Desk employs a hybrid Native + Web architecture:
- **Presentation & GUI:** React 18 + Vite + Tailwind CSS embedded inside Tauri v2 for native desktop execution (Mac & Windows) as well as modern browser accessibility.
- **Native OS & GPU Engine:** Tauri v2 / Rust Core with platform-specific FFI bindings for low-latency desktop capture, input injection, and display management.
- **Transport Pipeline:** WebRTC Peer-to-Peer (P2P) data and media streams over UDP, optimized with `playoutDelayHint = 0` and minimal jitter buffering for ultra-low interactive latency.
- **Signaling & Presence:** Supabase Realtime Broadcast mesh (`bidesk_p2p_mesh`) eliminating server-side bottlenecks and providing sub-100ms SDP exchange.
- **Data & Auth:** Supabase PostgreSQL with strict Row Level Security (RLS) enforcing device ownership and user role boundaries.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Device                         │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │  React 18 + Vite GUI  │       │ Hardware Video Dec    │  │
│  │  (Viewport, HUD Bar)  │       │ (Metal / D3D11VA)     │  │
│  └───────────┬───────────┘       └───────────▲───────────┘  │
│              │ (DataChannel Input)           │ (WebRTC RTP) │
└──────────────┼───────────────────────────────┼──────────────┘
               │                               │
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                    Network Layer (UDP P2P)                  │
│   • Direct STUN / UPnP NAT Traversal                        │
│   • Fallback TURN Relay                                     │
│   • Supabase Realtime Signaling Mesh                        │
└──────────────────────────────────────────────┬──────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────┐
│                        Host Device                          │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Native Input Handler  │       │ Zero-Copy GPU Capture │  │
│  │ (CGEvent / SendInput) │       │ (ScreenCaptureKit/DXGI│  │
│  └───────────────────────┘       └───────────────────────┘  │
│                              Rust / Tauri v2 Daemon         │
└─────────────────────────────────────────────────────────────┘
```

## 2. Layer Choices & Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Desktop Wrapper** | Tauri v2 (Rust) | Sub-15MB bundle size, memory efficiency, direct native Win32/macOS API access, secure IPC. |
| **Client UI** | React 18 + TypeScript + Vite | 60-120 FPS high-refresh rate rendering, modular components, high responsiveness. |
| **Styling** | Tailwind CSS | Sleek dark theme matching Parsec's exact UI design tokens. |
| **Media Transport** | WebRTC P2P (UDP) | Standardized, hardware-accelerated video streaming with built-in ICE/STUN/TURN NAT traversal. |
| **macOS Screen Capture** | ScreenCaptureKit / CoreGraphics | Modern zero-copy GPU frame capture on macOS 12.3+. |
| **Windows Screen Capture** | DXGI Desktop Duplication | Hardware frame grab directly from GPU VRAM (<1ms). |
| **Input Injection** | `CGEventPost` (Mac) / `SendInput` (Win) | OS-level kernel/event loop injection without delay. |
| **Signaling** | Supabase Realtime Broadcast | Zero-cost serverless WebSocket mesh preventing database locking. |
| **Database & Auth** | Supabase Postgres + Auth | Secure JWT session management, RLS device isolation. |

## 3. Directory Layout (Unified Bi-app)

```
Bi-app/
├── client/                     # React 18 + Vite desktop/web client GUI
│   ├── src/
│   │   ├── components/         # Reusable presentation components (HUD, Settings, Modal)
│   │   ├── services/           # WebRTC engine, Supabase client, input handlers
│   │   ├── types/              # Strict TypeScript definitions
│   │   ├── App.tsx             # Main client application view
│   │   └── main.tsx            # Entry point
│   ├── src-tauri/              # Native Tauri v2 Rust backend
│   │   ├── src/
│   │   │   ├── capture.rs      # Native ScreenCaptureKit & DXGI frame capture
│   │   │   ├── input.rs        # Native mouse & keyboard injection
│   │   │   └── main.rs         # Tauri commands and lifecycle handlers
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   ├── package.json
│   └── vite.config.ts
├── docs/                       # Project engineering context (Rule 1)
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── RULES.md
│   ├── TASKS.md
│   ├── DECISIONS.md
│   ├── MEMORY.md
│   ├── TEST_PLAN.md
│   └── SECURITY.md
├── landing-page/               # Marketing & download portal
├── supabase/                   # Production PostgreSQL schema, RLS, Realtime signaling
├── scripts/                    # Automation scripts (packaging, installers)
└── README.md
```

## 4. Architectural Invariants
1. **No UI Database Queries:** UI components must never query Supabase directly; all data operations run through typed services in `client/src/services/`.
2. **Double-Check Rule:** Button hiding on frontend + independent role and ownership checks server-side (RLS).
3. **Zero Base64 Frame Streaming:** Video frames must flow through hardware WebRTC media tracks, never through Base64 JSON strings.
4. **Resilient Signaling:** If WebRTC direct P2P fails due to strict firewalls, connection falls back cleanly to configured TURN relays without freezing the UI.
