-- ==========================================================================
-- Bi Desk: Supabase Database Schema (Parsec 1:1 Replica)
-- ==========================================================================

-- 1. App Configuration & Maintenance Kill-Switch Table
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_maintenance BOOLEAN NOT NULL DEFAULT false,
    min_client_version TEXT NOT NULL DEFAULT '1.0.0',
    latest_version TEXT NOT NULL DEFAULT '1.2.3',
    announcement TEXT DEFAULT NULL,
    download_urls JSONB NOT NULL DEFAULT '{
        "windows": "https://bidesk-app-pi.vercel.app/downloads/Bi-Desk-Setup.exe",
        "mac_dmg": "https://bidesk-app-pi.vercel.app/downloads/Bi-Desk-Mac.dmg",
        "mac_zip": "https://bidesk-app-pi.vercel.app/downloads/Bi-Desk-Mac.zip",
        "linux_deb": "https://bidesk-app-pi.vercel.app/downloads/Bi-Desk-Linux.deb"
    }'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default config row if empty
INSERT INTO public.app_config (id, is_maintenance, min_client_version, latest_version)
SELECT gen_random_uuid(), false, '1.0.0', '1.2.3'
WHERE NOT EXISTS (SELECT 1 FROM public.app_config);

-- 2. Computers / Devices Registry Table
CREATE TABLE IF NOT EXISTS public.computers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    peer_id TEXT NOT NULL UNIQUE,
    is_online BOOLEAN NOT NULL DEFAULT true,
    is_hosting BOOLEAN NOT NULL DEFAULT false,
    ip_address TEXT DEFAULT NULL,
    system_info JSONB NOT NULL DEFAULT '{
        "os": "Windows",
        "resolution": "1920x1080",
        "fps": 60,
        "gpu": "DirectX 11 / Metal"
    }'::jsonb,
    settings JSONB NOT NULL DEFAULT '{
        "bitrate": 30,
        "resolution_mode": "auto",
        "role": "both",
        "color_format": "4:2:0"
    }'::jsonb,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_computers_user_id ON public.computers(user_id);
CREATE INDEX IF NOT EXISTS idx_computers_peer_id ON public.computers(peer_id);
CREATE INDEX IF NOT EXISTS idx_computers_is_online ON public.computers(is_online);
CREATE INDEX IF NOT EXISTS idx_computers_last_seen ON public.computers(last_seen);

-- 3. WebRTC Fallback Signaling Messages Table (for environments where WebSocket broadcast is blocked)
CREATE TABLE IF NOT EXISTS public.webrtc_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_peer_id TEXT NOT NULL,
    sender_peer_id TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'candidate')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signals_target ON public.webrtc_signals(target_peer_id);
CREATE INDEX IF NOT EXISTS idx_signals_created ON public.webrtc_signals(created_at);

-- Auto-delete signaling messages older than 2 minutes to keep table lean
CREATE OR REPLACE FUNCTION public.clean_old_signals()
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.webrtc_signals WHERE created_at < now() - interval '2 minutes';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clean_old_signals ON public.webrtc_signals;
CREATE TRIGGER trigger_clean_old_signals
AFTER INSERT ON public.webrtc_signals
EXECUTE PROCEDURE public.clean_old_signals();

-- 4. Row Level Security (RLS) Rules
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- App config: readable by all, writable only by service role / admin
CREATE POLICY "Allow public read app_config" ON public.app_config
    FOR SELECT USING (true);

-- Computers: users can view and manage their own computers
CREATE POLICY "Allow users to view own computers" ON public.computers
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow users to insert/update own computers" ON public.computers
    FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Signals: allow read/insert for signaling participants
CREATE POLICY "Allow all signal interactions" ON public.webrtc_signals
    FOR ALL USING (true);
