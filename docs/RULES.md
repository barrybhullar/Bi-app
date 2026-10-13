# Technical Constraints & Code Boundaries: Bi Desk

## 1. Security & Access Control Rules (CRITICAL)
- **Role Hierarchy Enforcement:**
  - `User`: Can only view, configure, and connect to devices belonging to their own `user_id`.
  - `Admin`: Can view system status and app metrics, but cannot delete Master Admin.
  - `Master Admin`: Full control over global kill-switch, maintenance mode, and device provisioning.
- **Double-Check Rule:**
  - UI hides unauthorized buttons or admin tools.
  - Backend (Supabase RLS & API) independently verifies user session role and ownership before executing any mutation.
- **No Magic Access:**
  - Never upgrade roles via client-side state or localStorage tampering.

## 2. Low-Latency Engineering Rules
- **Zero Base64 Video Transfer:**
  - Never pass image frames as base64 JPEG strings across IPC or WebSocket channels.
  - Use WebRTC `MediaStreamTrack` or native shared memory for video frames.
- **Zero Jitter Buffering:**
  - On the client video element and receiver, set `playoutDelayHint = 0` to prevent WebRTC from buffering frames.
- **Direct Event Injection:**
  - Mouse motion and click packets must be compact binary or minimal JSON payloads sent over unreliable, unordered WebRTC DataChannels (`maxRetransmits: 0` for mouse move, ordered for mouse clicks and keys).

## 3. Code Standards & TypeScript
- Strict TypeScript (`strict: true`) with no arbitrary `any` where typed interfaces are feasible.
- Component separation: UI presentation in `components/`, business & network logic in `services/`.
- No extraneous files or dead code: Keep the repository tidy.
