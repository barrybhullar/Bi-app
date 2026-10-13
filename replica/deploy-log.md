# Deploy Log: Bi Desk (Production Release v1.2.3)

Date: 2026-10-13
Deploy Target: Vercel Edge + GitHub + Supabase
Status: SUCCESS

## Deployed Artifacts

| Artifact | Type | Size | Target / URL | Status |
| --- | --- | --- | --- | --- |
| `Bi-Desk-Setup.exe` | Windows PE32+ GUI | 4.12 MB | `https://bidesk-app-pi.vercel.app/downloads/Bi-Desk-Setup.exe` | Verified Live |
| `Bi-Desk-Mac.dmg` | macOS aarch64 DMG | 1.65 MB | `https://bidesk-app-pi.vercel.app/downloads/Bi-Desk-Mac.dmg` | Verified Live |
| `Bi-Desk-Mac.zip` | macOS aarch64 ZIP | 1.62 MB | `https://bidesk-app-pi.vercel.app/downloads/Bi-Desk-Mac.zip` | Verified Live |
| Web Client | SPA (`/app/`) | 120 KB | `https://bidesk-app-pi.vercel.app/app/` | Verified Live |
| Landing Portal | HTML5 (`/`) | 14 KB | `https://bidesk-app-pi.vercel.app/` | Verified Live |
| Admin Portal | HTML5 (`/admin.html`) | 8 KB | `https://bidesk-app-pi.vercel.app/admin.html` | Verified Live |

## Git Sync Status
- Code Repository: `git@github.com:barrybhullar/Bi-code.git` (Commit `b9ab70e`)
- Public Deployment Repository: `git@github.com:barrybhullar/Bi-app.git` (Commit `8b2a29f`)

## Database & Signaling Status
- Supabase Endpoint: `https://zbbvybpxdfugfipozbvc.supabase.co`
- Realtime Broadcast Channel: `bidesk_p2p_mesh`
- Realtime Presence Channel: `bidesk_devices_presence`
- Maintenance Mode Table: `app_config` (Active & Listening)
