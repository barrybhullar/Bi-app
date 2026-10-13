# Security & Access Control Specification: Bi Desk

## 1. Authentication & Session Security
- User identity is verified using Supabase Auth with secure JWT tokens.
- Anonymous access is strictly limited to reading the public landing page and app downloads.
- Peer-to-peer stream requests require an active authenticated user session.

## 2. Role-Based Access Control (RBAC)
- **Hierarchy:** `User` (10) < `Admin` (50) < `Master Admin` (100).
- **Rule:** Role checks must be hierarchical: `if (user.role < required_role) return ACCESS_DENIED;`.
- **Sensitive Operations:**
  - Emergency Kill-Switch: Accessible only by `Master Admin`.
  - Machine Registration & Streaming: Scoped strictly to the owner (`user_id = auth.uid()`).
  - Remote Input Execution: Only accepted from authenticated peer matching the session credentials.

## 3. Double-Check Rule (Bug Prevention)
- **Frontend:** Hide control buttons for unauthorized users.
- **Backend (CRITICAL):** Supabase Row-Level Security (RLS) independently enforces ownership on the `computers` and `webrtc_signals` tables. Manipulating the browser client cannot grant access to another user's machines.

## 4. Input & Data Channel Sanitization
- All incoming input commands over WebRTC DataChannel (`mousemove`, `mousedown`, `keydown`) must undergo strict schema validation before OS kernel injection (`CGEventPost` / `SendInput`).
- Prevent any arbitrary shell or system command execution from the input channel.
