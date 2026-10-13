# Architectural Decision Records (ADRs): Bi Desk

## ADR-001: Monorepo Consolidation into Bi-app
- **Status:** Accepted
- **Context:** The project was split across two directories (`parsec-clone` containing source code and `Bi-app` containing only static landing page/downloads). This caused confusion, fragmented git tracking, and broken deployment paths.
- **Decision:** Consolidate all source code, native Tauri wrapper, landing page, and documentation into `/Users/barrybhullar/Desktop/Bi-app`.
- **Consequences:** Single source of truth, simpler builds, unified versioning.

## ADR-002: WebRTC P2P with Low-Latency Settings for V1
- **Status:** Accepted
- **Context:** Parsec uses a proprietary UDP protocol (BUD) written in native C. Developing a from-scratch UDP congestion control and encryption protocol from scratch takes months of testing.
- **Decision:** Use WebRTC Peer-to-Peer over UDP with zero-latency tuning (`playoutDelayHint = 0`, hardware H.264/HEVC, minimal jitter buffer) for V1. This delivers 10-25ms latency over LAN and works cross-platform.
- **Consequences:** Immediate compatibility across macOS, Windows, and modern web browsers without requiring custom network kernel drivers.

## ADR-003: Supabase Realtime Broadcast Mesh for Signaling
- **Status:** Accepted
- **Context:** WebRTC requires an exchange of SDP offers, answers, and ICE candidates between peers before a direct connection can form.
- **Decision:** Use Supabase Realtime Broadcast (`bidesk_p2p_mesh`) over WebSockets.
- **Consequences:** Eliminates database write bottlenecks during signaling, maintains free-tier compatibility, and enables instant connection handshakes.
