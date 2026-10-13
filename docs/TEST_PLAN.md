# Test Plan: Bi Desk

## 1. Unit & Build Verification
- **Frontend Typecheck:** `tsc --noEmit` inside `client/`.
- **Frontend Build:** `npm run build` inside `client/`.
- **Tauri Rust Check:** `cargo check` inside `client/src-tauri/`.

## 2. WebRTC P2P Connection Tests
- **Signaling Handshake Test:**
  - Verify `offer`, `answer`, and `candidate` messages are correctly formatted and received over `bidesk_p2p_mesh`.
- **NAT Traversal Test:**
  - Verify STUN candidates are generated for direct UDP binding.
  - Verify TURN fallback connects when direct UDP is blocked.
- **Connection Recovery Test:**
  - Test automatic reconnection when network drops or when host toggles off/on.

## 3. Streaming & Latency Tests
- **Frame Rate Stability:** Verify video stream sustains 60 FPS without frame freezing.
- **End-to-End Latency Measurement:** Verify round-trip latency is under 20ms on LAN.
- **Input Responsiveness:** Verify mouse movements and clicks execute on host with sub-5ms delay.
- **Display Switching:** Verify multi-display switching (D1, D2, Virtual Displays) seamlessly without tearing.
