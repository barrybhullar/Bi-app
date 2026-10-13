# Product Requirements Document (PRD): Bi Desk

## 1. Problem Statement
Existing remote desktop tools (TeamViewer, AnyDesk) are designed for IT support rather than real-time interactive tasks or cloud gaming. They suffer from high latency (80-250ms), low frame rates (15-30 FPS), poor color reproduction, and choppy mouse movement. While Parsec provides an ultra-low latency experience, an open, fully integrated self-hosted alternative with modern cross-platform support (Mac and PC) and reliable P2P connectivity is required.

The initial prototype failed because it relied on mock signaling, dummy canvas captures, and slow screenshot scripts (`/usr/sbin/screencapture` on Mac, GDI `StretchBlt` on Windows), resulting in unusable latency (>500ms), low FPS (<5 FPS), and connection failures.

## 2. Target Users
- **Remote Workers & Creators:** Video editors, 3D artists, and developers needing fluid remote desktop access to powerful Mac/PC workstations.
- **Gamers:** Players streaming high-FPS PC games to laptops or Macs with near-zero latency and responsive gamepad/mouse controls.
- **Cross-Platform Power Users:** Users working interchangeably between macOS and Windows devices.

## 3. Core Outcomes & Goals
- **End-to-End Latency:** Sub-20ms round-trip time (RTT) over LAN; sub-40ms over regional broadband.
- **Frame Rate:** Sustained 60 FPS (with capability for 120 FPS).
- **One-Click P2P Connection:** Instant connection handshake via Supabase Realtime broadcast and STUN/TURN ICE negotiation.
- **Hardware-Accelerated Screen Capture & Streaming:** Direct GPU frame capture with ScreenCaptureKit on macOS and DXGI on Windows.
- **Real-Time Input Injection:** Hardware-level mouse, keyboard, and gamepad replication without noticeable lag.

## 4. MVP Scope (V1)
- **Monorepo Structure:** All source code, client, native wrappers, landing page, and docs unified into `/Users/barrybhullar/Desktop/Bi-app`.
- **Client App (React 18 + Vite + Tailwind):** Parsec-style dark GUI featuring device discovery, live status indicators, stream viewport, floating in-session HUD (FPS, latency, bitrate), and full settings.
- **Native Host & Client Core (Tauri v2 + Rust):**
  - High-performance screen capture: Native OS integration (macOS ScreenCaptureKit / Windows DXGI).
  - WebRTC P2P Video & Input Pipeline: Ultra-low latency video stream and WebRTC DataChannel for input.
  - Native Input Injection: `CGEventPost` for macOS and `SendInput` for Windows.
- **Signaling & Presence (Supabase):** Realtime WebSocket broadcast channel (`bidesk_p2p_mesh`) for ICE candidates, SDP offer/answer exchange, and live heartbeat presence.
- **Security & RBAC:** Strict account isolation via Supabase Auth and Row-Level Security (RLS).

## 5. Out of Scope (V1)
- Multi-host virtual LAN party / Arcade party hosting (V2).
- Virtual audio cable driver installation on Windows (V2).
- Custom proprietary BUD transport protocol compilation in pure C (V1 uses optimized WebRTC P2P; custom transport is V2).

## 6. Success Criteria
- [x] Unify `/Users/barrybhullar/Desktop/parsec-clone` and `/Users/barrybhullar/Desktop/Bi-app` into a single organized workspace.
- [x] Host and Client discover each other instantly on the same account via Supabase Realtime.
- [x] Clicking "Connect" establishes an active P2P session in under 3 seconds.
- [x] Remote screen renders continuously at 60 FPS with responsive mouse and keyboard control.
