# Recon Map: Parsec (Cross-Platform Remote Desktop & Gaming)

Scope: Complete low-latency remote desktop engine (Host daemon, Client viewer, Native installers for Windows/macOS/Linux, P2P WebRTC/UDP streaming, Settings & Warp Pro features)
For: Bi Desk (The user's self-hosted, ultra-low latency remote desktop platform)
Date: 2026-10-13

## Sources

| # | Source | URL / File | Notes |
| --- | --- | --- | --- |
| 1 | Parsec Linux DEB | `Downloadslte/parsec-linux.deb` | Extracted `parsecd` launcher, `parsecd-150-104a.so`, `appdata.json`, desktop entry |
| 2 | Parsec macOS PKG | `Downloadslte/parsec-macos.pkg` | Extracted `Parsec.app`, `parsecd`, `parsecd-150-101a.dylib`, `Info.plist`, launch agent scripts |
| 3 | Parsec Windows Installer | `Downloadslte/parsec-windows.exe` | NSIS container, system tray daemon, DirectX capture hooks, virtual display drivers |
| 4 | Official Features & Warp | `https://parsec.app/features`, `https://parsec.app/warp` | 4:4:4 color, multi-monitor, virtual displays, 240 FPS streaming, privacy mode |
| 5 | Parsec Teams & Enterprise | `https://parsec.app/teams`, `https://parsec.app/enterprise` | SAML SSO, team computers, permission templates, audit logs, kill-switch / maintenance |

## Core Loop

One-click sub-5ms interactive desktop streaming between host and client with zero-config NAT traversal, hardware acceleration, and full input replication.

## Screens

| ID | Screen | Route / How to reach | Purpose | Key Components | States Seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Authentication | `/login` / launch | User identity & device authorization | Email/Pass inputs, SSO button, 2FA code modal | Empty, Loading, Error, 2FA required |
| S02 | Computers Hub | `/app` / main window | Device discovery, status & connection launcher | Sidebar nav, Host cards grid, Status pills, Add PC, Quick Connect | Empty (no PCs), Loading, Online, In-Use, Offline |
| S03 | In-Session Stream Window | Click "Connect" on S02 | Fullscreen 60-240 FPS hardware-accelerated viewport | Video element / canvas, relative mouse grabber, audio stream | Connecting, Handshake, Live Streaming, Reconnecting, Disconnected |
| S04 | In-Session Floating Overlay HUD | Overlay hotkey (`Ctrl+Shift+M`) or hover widget | Quick stream tuning, monitor switch, performance metrics | Floating island, FPS/Latency/Bitrate badges, Display tabs, Disconnect button | Hidden, Active pill, Expanded panel, Network warning |
| S05 | Settings - Client | `/settings/client` | Decode, rendering & display preferences | Renderer dropdown (Metal/DX11/Vulkan), VSync toggle, H.265/AV1 toggle, Overlay hotkey | Default, Custom, Hardware unsupported warning |
| S06 | Settings - Host | `/settings/host` | Screen capture, bandwidth, resolution & privacy mode | Host On/Off toggle, Bitrate slider (5-100 Mbps), FPS cap, Resolution selector (Auto/Host/Client/Custom), Privacy mode | Hosting Active, Disabled, Error (Capture permission denied) |
| S07 | Settings - Network & Relay | `/settings/network` | P2P NAT traversal & proxy rules | Port range inputs, UPnP toggle, STUN/TURN server configuration, Proxy input | Auto, Custom STUN, Relay active |
| S08 | Warp Pro & Multi-Screen Hub | `/warp` or Overlay tabs | Advanced multi-monitor & professional creator features | Virtual display adder, 4:4:4 color toggle, 10-Bit HDR switch, Pen/Stylus tablet mode | Standard, Warp Active, Feature Locked |
| S09 | Admin & Maintenance Mode | `/admin.html` (Web portal) | Remote kill-switch, mandatory update enforcement | Maintenance switch, minimum required version, broadcast announcement | Maintenance Active, Normal Operations |

## Flows

```
F01 Connect to Remote Computer (Core Loop)
    S01 (Sign In) -> S02 (Select Computer) -> Click Connect -> S03 (Live Stream)
    Happy path clicks: 2
    Edge: Host offline, NAT blocked (fallback to TURN relay), decoder crash (fallback to H.264/Canvas)

F02 Quick Overlay Tuning & Monitor Switch
    S03 (Live Stream) -> Press Ctrl+Shift+M -> S04 (Overlay HUD) -> Select Display 2 -> S03 (Updated Stream)
    Happy path clicks: 1
    Edge: Virtual display not installed, single monitor setup

F03 Share Desktop to Guest via Link / PIN
    S02 (Hub) -> Click "Share" -> S02 Modal (Generate Guest Link) -> Guest clicks link -> Host approves input permissions
    Happy path clicks: 2
    Edge: Link expired, guest disconnected, guest input restricted (view-only)

F04 Emergency Maintenance & Kill Switch
    Admin triggers Maintenance in Supabase / S09 -> All connected clients receive broadcast -> Transition to S01 with update prompt
    Happy path clicks: 1
```

## Components

| Component | Variants | States | Used On |
| --- | --- | --- | --- |
| ComputerCard | Grid card, Compact row | Online (green), Busy (yellow), Offline (gray), Hover | S02 |
| OverlayHUD | Collapsed badge, Floating pill, Expanded controls | Normal, Network Warning (high ping/loss), Draggable | S04 |
| VideoViewport | Letterboxed, Stretched, 1:1 Pixel perfect | Initializing, Playing, Black frame recovery | S03 |
| DisplaySwitchBar | Single tab, Multi-tab with '+ Virtual Display' | Active monitor, Inactive, Adding | S04, S08 |
| BitrateSlider | 5 Mbps to 100 Mbps | Default (30 Mbps), Dragging, Disabled | S06 |
| InputCaptureHook | Native Tauri P/Invoke (Win) / CGEvent (Mac) | Focused, Background, Relative lock | S03 |

## Inferred Data Model

```
User           id (uuid), email (text), username (text), warp_tier (text: free|pro|enterprise), created_at (timestamptz)
               evidence: S01 auth flow, appdata.json account token
               confidence: high

Computer       id (uuid), user_id (uuid), name (text), peer_id (text), is_online (boolean), last_seen (timestamptz),
               system_info (jsonb: os, gpu, displays, resolution), settings (jsonb: fps, bitrate, codec, color),
               evidence: Supabase computers table, parsecd host registration payload
               confidence: high

SignalingMesh  channel (text: bidesk_p2p_mesh), event (text: signal),
               payload (jsonb: type[offer|answer|candidate], from, to, sdp, candidate)
               evidence: WebRTC P2P signaling logs, Supabase realtime broadcast
               confidence: high

AppConfig      id (uuid), is_maintenance (boolean), min_client_version (text), download_urls (jsonb),
               announcement (text), updated_at (timestamptz)
               evidence: S09 admin portal, killswitch requirement
               confidence: high
```

## Feature Matrix

See `replica/features.csv`.
- Must: 12
- Should: 8
- Could: 5
- Skip: 2 (Third-party arcade game marketplace, proprietary Parsec Cloud cloud-hosted gaming instances)

## Out of Scope

- Proprietary Parsec Arcade third-party game licensing deals (Focus is on ultra-low latency Remote Desktop for Work, Pro Gaming, and Teams).
- Parsec Cloud dedicated virtual machine hosting infrastructure (Bi Desk is self-hosted / BYO-machine P2P).

## Size

Screens: 9, Flows: 4, Entities: 4. Hard parts: Cross-platform low-latency WebRTC NAT traversal, hardware encoder hooks, native Windows/macOS/Linux input injection. Size: M.