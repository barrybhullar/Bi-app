# Build Log: Bi Desk (Parsec 1:1 Clean-Room Clone)

Methodology: `replica-build` clean-room implementation based on reverse-engineered specs from `Downloadslte/parsec-linux.deb`, `parsec-windows.exe`, `parsec-macos.pkg`, and Parsec Warp specifications.

## Screen Progress & Verification

| Screen ID | Name | Route / View | Status | Definition of Done Checklist | Notes |
| --- | --- | --- | --- | --- | --- |
| S01 | Authentication & User Session | `/login` / initial state | Done | [x] Empty, loading, error states\n[x] Persistent Supabase auth\n[x] Responsive 390px & 1440px | Clean dark login modal with session persistence |
| S02 | Computers Hub | `/app` main window | Done | [x] Online/Offline/Busy states\n[x] Realtime Presence Mesh\n[x] 'Share This PC' toggle\n[x] Section A Device Roles | Live device cards with heartbeat sync via Supabase Realtime |
| S03 | In-Session Stream Viewport | Active session | Done | [x] Hardware accelerated video\n[x] 60 FPS fallback canvas\n[x] Low latency buffer delay hint\n[x] Relative & absolute mouse grab | WebRTC MediaStream bound directly to `<video>` with auto-recovery |
| S04 | In-Session Floating Overlay HUD | Floating widget / `Ctrl+Shift+M` | Done | [x] Live Ping (RTT) & Bitrate display\n[x] Multi-monitor switch tabs\n[x] Fullscreen toggle\n[x] Disconnect button | Parsec signature overlay badge in top-right with live metrics |
| S05 | Settings - Client | Settings Modal -> Client tab | Done | [x] H.265 / AV1 toggles\n[x] VSync & Renderer selector\n[x] Client resolution target | Quick target resolution cards (Auto/Host/Client/Custom) |
| S06 | Settings - Host | Settings Modal -> Host tab | Done | [x] Bitrate slider (5-100 Mbps)\n[x] FPS cap (30-240 FPS)\n[x] Host streaming toggle | Live bandwidth limiter updating RTCPeerConnection parameters |
| S07 | Settings - Network & Relay | Settings Modal -> Network tab | Done | [x] STUN/TURN server overrides\n[x] UPnP & Port configuration | Fallback to Google STUN and custom TURN relay |
| S08 | Warp Pro & Multi-Screen Hub | Settings Modal -> Warp tab / Overlay | Done | [x] YUV 4:4:4 Color mode\n[x] 10-Bit HDR toggle\n[x] Virtual display adder | Replicates Parsec Warp high-fidelity color profile |
| S09 | Admin Portal & Kill-Switch | `/admin.html` web portal | Done | [x] Global maintenance toggle\n[x] Min version enforcement\n[x] Announcement broadcast | Live listener in clients forces update screen when enabled |

## Cross-Platform Packaging Log

1. **Windows (.exe):**
   - Compiled native Windows PE32+ GUI executable via `cargo xwin` for `x86_64-pc-windows-msvc`.
   - Zero external web server dependencies (Frontend bundled directly inside binary via `dist/`).
   - Binary: `dist-app/downloads/Bi-Desk-Setup.exe` (4.1 MB).

2. **macOS (.dmg & .zip):**
   - Compiled native macOS bundle via `npx tauri build` for Apple Silicon `aarch64`.
   - Ad-hoc codesigned and quarantine cleared via `xattr -cr` and `codesign --force --deep --sign -`.
   - Packages: `dist-app/downloads/Bi-Desk-Mac.dmg` (1.7 MB), `dist-app/downloads/Bi-Desk-Mac.zip` (1.6 MB).

3. **Web Client & Distribution:**
   - Deployed to Vercel production at `https://bidesk-app-pi.vercel.app`.
   - Web viewer accessible at `https://bidesk-app-pi.vercel.app/app/`.
