# Phased Implementation Tasks: Bi Desk

## Phase 1: Context & Monorepo Consolidation
- [x] **TASK-001:** Create core Vibe Coding documents (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `DECISIONS.md`, `MEMORY.md`, `TEST_PLAN.md`, `SECURITY.md`).
- [x] **TASK-002:** Unify `/Users/barrybhullar/Desktop/parsec-clone` into `/Users/barrybhullar/Desktop/Bi-app` (move client-app, src-tauri, supabase, scripts, and landing-page).
- [x] **TASK-003:** Verify dependencies and clean up redundant build artifacts.

## Phase 2: WebRTC Signaling & Instant Device Discovery
- [x] **TASK-004:** Refactor Supabase Realtime signaling to guarantee bidirectional handshake without race conditions.
- [x] **TASK-005:** Add automatic host startup mode, Quick Connect by Peer ID, and persistent presence heartbeat.
- [x] **TASK-006:** Implement guest / local network auto-discovery fallback (local mesh broadcast).

## Phase 3: True Low-Latency Video Pipeline
- [x] **TASK-007:** Replace simulated canvas stream with high-performance WebRTC MediaStream video pipeline.
- [x] **TASK-008:** Integrate native screen capture hooks (macOS ScreenCaptureKit / Windows DXGI) within Tauri.
- [x] **TASK-009:** Configure ultra-low latency WebRTC receiver (`playoutDelayHint = 0`, hardware H.264 decoding).

## Phase 4: Low-Latency Input & Floating HUD
- [x] **TASK-010:** Split input DataChannel into unordered channel for mouse moves and reliable channel for keys/clicks.
- [x] **TASK-011:** Implement relative mouse mode for gaming and seamless pointer lock.
- [x] **TASK-012:** Build the floating Parsec-style in-session HUD with live metrics (FPS, RTT latency, bitrate).

## Phase 5: Verification & Production Build
- [x] **TASK-013:** Typecheck and lint validation across the entire unified codebase (`npm run build` & `cargo check`).
- [x] **TASK-014:** End-to-end connection testing between host and client.
- [x] **TASK-015:** Final documentation update and git commit.
