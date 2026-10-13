# Visual Design System & UX Specification: Bi Desk

## 1. Visual Theme & Aesthetic
Bi Desk replicates the high-performance dark gaming aesthetic of Parsec:
- **Backgrounds:** Pitch Black (`#0A0C10`), Surface Black (`#12151D`), Card Surface (`#181D28`), Border Accent (`#262D3D`).
- **Brand Accents:**
  - Electric Red: `#EF4444` (Primary brand color, gradients).
  - Neon Cyan / Parsec Blue: `#25ABFF` (Active streaming indicators, status).
  - Emerald Green: `#10B981` (Online indicators, low latency status).
  - Warning Amber: `#F59E0B` (Network congestion, moderate latency).
  - Destructive Red: `#DC2626` (Disconnect, kill switch, errors).
- **Typography:**
  - Headings & Body: Plus Jakarta Sans / Inter (`sans-serif`).
  - Technical Metrics & Code: JetBrains Mono (`monospace`).

## 2. Key Screen Specifications

### S01: Auth & Login Modal
- Clean centered modal with dark backdrop blur.
- Email/Password sign-in and sign-up with instant inline validation.
- Guest / Local demo bypass mode for immediate local testing.

### S02: Hub & Device List (Parsec Sidebar + Grid)
- Left navigation bar: Computers icon, Settings gear, Network globe, User avatar.
- Main area: Grid of discovered computers.
- Computer Card:
  - OS Icon (Apple logo / Windows logo).
  - Machine Name & Owner email badge.
  - Live pulse dot (Green = Hosting & Ready, Blue = Idle, Gray = Offline).
  - GPU / Screen info (`Apple Metal 60 FPS` / `DirectX 11 NVENC`).
  - Action button: "Connect" (gradient hover) or "Enable Hosting" toggle.

### S03: Streaming Viewport & Floating HUD
- Fullscreen zero-margin video viewport with hardware scaling (`object-fit: contain`).
- Mouse pointer lock with automatic relative/absolute cursor switching.
- **Floating In-Session HUD (Parsec Overlay Icon):**
  - Collapsible pill widget floating at the top-center.
  - Metrics display: Live FPS (`60 FPS`), Network RTT (`8.2 ms`), Bandwidth (`32.4 Mbps`), Codec (`H.264`).
  - Controls: Display Switcher (D1, D2), Settings cog, Disconnect button.

### S04: Settings Modal
- Tabs: Client, Host, Network, System.
- Sliders: Bandwidth (5 - 100 Mbps), FPS Limit (30, 60, 120, 240).
- Dropdowns: Decoder (Hardware / Software), Renderer (Metal / DirectX), Audio quality.

## 3. UX States & Fallbacks
- **Loading State:** Shimmering skeleton cards on computer list while initial Supabase handshake settles.
- **Connecting State:** Animated pulse indicator with step-by-step progress: `Signaling...` -> `ICE Negotiation...` -> `Stream Live`.
- **Empty State:** Helpful prompt ("No computers found. Install Bi Desk on your host computer or toggle 'Enable Hosting' above.").
- **Error State:** Clear actionable banner with retry button on connection failure or network timeout.
