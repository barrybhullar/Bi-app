-- ==================================================================
-- PARSEC-CLONE SUPABASE PRODUCTION SCHEMA
-- Copy and paste this into Supabase SQL Editor and click RUN
-- ==================================================================

-- 1. REMOTE KILL-SWITCH, MAINTENANCE MODE & FORCE UPDATE
CREATE TABLE IF NOT EXISTS public.app_config (
    id INT PRIMARY KEY DEFAULT 1,
    is_maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT DEFAULT 'ਐਪ ਸਰਵਰ ਮੇਨਟੇਨੈਂਸ ਅਧੀਨ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    min_supported_version TEXT DEFAULT '1.0.0',
    latest_version TEXT DEFAULT '1.0.0',
    update_url TEXT DEFAULT 'https://github.com/your-org/parsec-clone/releases/latest',
    kill_switch BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.app_config (id, is_maintenance_mode, min_supported_version, latest_version)
VALUES (1, false, '1.0.0', '1.0.0')
ON CONFLICT (id) DO NOTHING;

-- 2. REGISTERED HOST COMPUTERS (Windows Host / macOS Host)
CREATE TABLE IF NOT EXISTS public.computers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    peer_id TEXT UNIQUE NOT NULL,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    public_ip TEXT,
    system_info JSONB DEFAULT '{}'::jsonb, -- CPU, GPU (NVENC/AMF), OS, Resolution
    settings JSONB DEFAULT '{"fps": 60, "bitrate": 30, "codec": "h264", "color": "4:2:0"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WEBRTC / P2P SIGNALING MESSAGES (Offers, Answers, ICE Candidates)
CREATE TABLE IF NOT EXISTS public.signaling (
    id BIGSERIAL PRIMARY KEY,
    from_peer TEXT NOT NULL,
    to_peer TEXT NOT NULL,
    signal_type TEXT NOT NULL, -- 'offer', 'answer', 'candidate'
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signaling ENABLE ROW LEVEL SECURITY;

-- App config can be read by any authenticated or anon user
CREATE POLICY "Anyone can read app_config"
ON public.app_config FOR SELECT USING (true);

-- Users can only see and manage their own computers
CREATE POLICY "Users can view own computers"
ON public.computers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own computers"
ON public.computers FOR ALL USING (auth.uid() = user_id);

-- Signaling: peers can write and read directed messages
CREATE POLICY "Authenticated users can send signaling"
ON public.signaling FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can receive signaling"
ON public.signaling FOR SELECT USING (true);

-- 5. ENABLE REALTIME BROADCAST
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.computers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signaling;
