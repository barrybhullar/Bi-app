# Primitives: Bi Desk (Parsec Design System)

Tokens reference: `replica/design/tokens.json`. All components follow the Parsec dark gaming aesthetic.

## 1. Button

Variants: `primary`, `secondary`, `warp`, `ghost`, `danger`.
Sizes: `sm` (h-7 px-3 text-xs), `md` (h-9 px-4 text-sm), `lg` (h-11 px-6 text-base).

| State | Primary (Connect) | Secondary (Manage) | Warp Pro | Danger (Disconnect) |
| --- | --- | --- | --- | --- |
| default | bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg shadow-sm | bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg | bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-md | bg-red-600 hover:bg-red-500 text-white rounded-lg |
| hover | bg-sky-500 shadow-md | bg-slate-700 text-white | brightness-110 shadow-lg | bg-red-500 |
| active | scale-[0.98] | scale-[0.98] | scale-[0.98] | scale-[0.98] |
| disabled | opacity-40 cursor-not-allowed pointer-events-none | opacity-40 cursor-not-allowed | opacity-40 cursor-not-allowed | opacity-40 cursor-not-allowed |
| loading | Animate-pulse with inline spinner | Animate-pulse | Animate-pulse | Animate-pulse |

Accessibility:
- `type="button"` default
- Focus ring: `focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none`
- `aria-label` provided for icon-only buttons (overlay collapse, display tabs).

## 2. Input / Setting Field

- **Structure:** Label (`text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5`) -> Input (`h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500`).
- **Dropdown / Select:** `bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-sky-500`.
- **Slider (Bitrate 5-100 Mbps):** Range input with sky-500 fill accent, step values, and direct Mbps readout badge.
- **Radio Card (Section A/B):** Selectable tile with border glow when active (`border-sky-500 bg-sky-500/10`).

## 3. Computer Card (Host Hub)

- **Structure:** `bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 backdrop-blur-sm transition-all duration-200 flex flex-col justify-between`.
- **Header:** OS Icon (Windows/Mac/Linux) + Host Name + Online Status Pill (`w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse`).
- **Specs Badges:** Resolution (1920x1080), FPS (60/120 FPS), Encoder (NVENC/Metal/Canvas).
- **Action Bar:** Large primary "Connect" button + "Restart Stream" or "Host Settings".

## 4. In-Session Floating Overlay HUD

- **Backdrop / Frame:** `bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-hud px-4 py-2 flex items-center gap-3 z-50 fixed top-4 right-6`.
- **Metrics Badges:**
  - Ping: `text-emerald-400 font-mono text-xs flex items-center gap-1` (e.g., `⚡ 6ms`)
  - Bitrate: `text-sky-400 font-mono text-xs` (e.g., `30.2 Mbps`)
  - Resolution: `text-slate-300 font-mono text-xs` (e.g., `1080p @ 60fps`)
- **Display Switcher Tabs:** Monitor 1 (`[1]`), Monitor 2 (`[2]`), Add Virtual (`[+]`).
- **Quick Controls:** Fullscreen toggle, Audio mute toggle, Disconnect button.

## 5. Empty State

- **Structure:** `flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30`.
- **Elements:**
  1. Glowing Device Icon (`w-12 h-12 text-slate-600 mb-4`)
  2. Title: "No Computers Online" (`text-lg font-semibold text-slate-200 mb-1`)
  3. Description: "Start Bi Desk on your host computer or enable 'Share This PC' below to allow incoming connections." (`text-sm text-slate-400 max-w-md mb-6`)
  4. Action: Button `primary` ("Share / Host This PC Now").
