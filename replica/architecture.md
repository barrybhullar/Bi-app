# Architecture: Bi Desk (Parsec 1:1 Cross-Platform Replica)

Stack in one line: Tauri v2 + Rust, React 18 + TypeScript + Vite, Tailwind CSS, WebRTC P2P, Supabase (Postgres + Auth + Realtime Broadcast), Vercel.

## Layer choices

| Layer | Choice | Why |
| --- | --- | --- |
| Desktop Client & Host | Tauri v2 + Rust | Native memory efficiency, direct Win32/macOS CGEvent/Linux X11 system call access, sub-10MB bundle size, security sandbox |
| UI & Web Client | React 18 + Vite + TypeScript | 60-120 FPS high refresh-rate rendering, shared codebase between native desktop app and browser client (/app/) |
| Styling | Tailwind CSS | Fast custom dark gaming aesthetic matching Parsec's exact UI design tokens, responsive layout |
| Low-Latency Streaming | WebRTC P2P (H.264/H.265/Canvas) | Sub-15ms interactive display streaming, UDP-based real-time transport, built-in NAT traversal (ICE/STUN/TURN) |
| Signaling & Presence | Supabase Realtime Broadcast | Zero-cost serverless WebSocket mesh (`bidesk_p2p_mesh` & `bidesk_devices_presence`) eliminating database bottleneck |
| Database | Supabase (Postgres) | Fully managed Postgres with Row-Level Security (RLS) ensuring strict isolation of user machines & credentials |
| Authentication | Supabase Auth | Secure token-based session persistence, prevents credentials from being exposed in client code |
| Hosting & Downloads | Vercel Edge Network | Global CDN for high-speed binary downloads (.exe, .dmg, .zip, .deb) and instant web client availability |

## Schema

See `replica/schema.sql`. 4 tables, 8 indexes, 4 status enums/constraints.

Key constraints:
- Every machine (`computers`) belongs to an authenticated user (`user_id references auth.users(id) on delete cascade`).
- Unique `peer_id` per active host instance preventing signaling collisions.
- Realtime presence heartbeats with auto-expiration index on `last_seen`.
- Global application kill-switch and maintenance mode configuration table with version requirement verification.

## API & Realtime Signaling Actions

| Method / Channel | Route / Event | What it does | Caller | Flow |
| --- | --- | --- | --- | --- |
| Realtime Broadcast | `bidesk_p2p_mesh:signal` (offer) | Client initiates WebRTC session with SDP offer & candidates | Authenticated Client | F01 (Connect) |
| Realtime Broadcast | `bidesk_p2p_mesh:signal` (answer) | Host accepts session with SDP answer & ICE candidates | Host Instance | F01 (Connect) |
| Realtime Presence | `bidesk_devices_presence:sync` | Publishes live device state, OS, GPU and hosting status | Host Instance | F01 (Discovery) |
| WebRTC DataChannel | `input_data_channel` | Binary/JSON mouse motion, clicks, and keyboard inputs | Connected Client | F01 (Control) |
| REST (Supabase) | `GET /rest/v1/app_config` | Checks maintenance mode and minimum client version | Any Client / App | F04 (Kill-Switch) |
| REST (Supabase) | `PATCH /rest/v1/app_config` | Admin toggles maintenance mode or broadcasts message | Admin Portal | F04 (Kill-Switch) |

## The parts that bite

- **NAT Traversal & Symmetric Firewalls:** Enterprise and mobile networks block direct UDP peer connections. Configured public Google/Cloudflare STUN with fallback TURN relay prevents connection timeouts.
- **Hardware Acceleration & Permissions:** macOS requires Screen Recording & Accessibility permissions; Windows requires UAC elevation for secure desktop interaction. Win32 SendInput / mouse_event hooks provide zero-delay input replication.
- **Clean Frame Pipeline:** Preventing video buffer bloat in WebRTC is critical for gaming latency. Using `playoutDelayHint = 0` and low-jitter frame dropping keeps latency under 15ms.
- **Maintenance Kill-Switch Idempotency:** When `is_maintenance` is toggled true in the database, all active clients instantly drop peer connections and present the update prompt gracefully without crashing.

## Build Order

1. **Vertical Slice (Completed & Verified):**
   - Screens: S01 (Auth), S02 (Hub), S03 (Stream Viewport).
   - Tables: `computers`, `app_config`.
   - Realtime: `bidesk_p2p_mesh` broadcast handshake, 60 FPS video pipeline, Win32/macOS mouse/keyboard injection.
2. **Milestone 1: Parsec Full Feature Parity:**
   - S04 Floating In-Session HUD (live FPS, bitrate, RTT latency, monitor switcher).
   - S05/S06 Client & Host settings (Bitrate slider 5-100 Mbps, Resolution modes Auto/Host/Client/Custom, Device Roles).
3. **Milestone 2: Packaging & Native Installers:**
   - Windows: NSIS self-contained PE32+ GUI executable (`Bi-Desk-Setup.exe`).
   - macOS: DMG & ZIP ad-hoc signed (`Bi-Desk-Mac.dmg`, `Bi-Desk-Mac.zip`).
   - Linux: Debian package (`Bi-Desk-Linux.deb`).
4. **Milestone 3: Parsec Warp Pro Capabilities:**
   - YUV 4:4:4 & 10-Bit color accurate rendering.
   - Multi-monitor switching and virtual display handling.

## Risk Summary

Top 3 risks to watch during build:
1. **Firewall / Double NAT Failure:** If STUN fails, ensure WebRTC falls back cleanly to relay without hanging the client.
2. **Tauri Webview Asset Paths:** Native executables require `base: './'` in Vite so assets load from within the binary rather than looking for localhost.
3. **OS Security SmartScreen & Gatekeeper:** Self-signed binaries must include clear user bypass instructions and clean extended attributes (`xattr -cr`).