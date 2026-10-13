import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor, Settings, ShieldAlert, Power, RefreshCw, Play, CheckCircle2,
  LogIn, UserPlus, LogOut, Minimize2, Maximize2, X, Plus, Radio,
  Columns, Sparkles, Sliders, Laptop, Cpu, Layers, Copy, MonitorUp
} from 'lucide-react';
import { supabase, Computer, AppConfig, updateSupabaseConfig } from './supabase';
import {
  BiDeskStreamSession, BiDeskHostService, StreamStats, DisplayScreen,
  detectLocalPhysicalDisplays
} from './webrtc';

export function App() {
  // ── Auth State ──────────────────────────────────────────────────────────
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── UI State ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'computers' | 'settings'>('computers');
  const [settingsCategory, setSettingsCategory] = useState<'client' | 'host' | 'input' | 'account' | 'network'>('client');
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  // ── Quick Connect State ─────────────────────────────────────────────────
  const [quickConnectId, setQuickConnectId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [customSupaUrl, setCustomSupaUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('bidesk_supabase_url') || '' : ''));
  const [customSupaKey, setCustomSupaKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('bidesk_supabase_key') || '' : ''));

  // ── Streaming State ─────────────────────────────────────────────────────
  const [activeHost, setActiveHost] = useState<Computer | null>(null);
  const [streamStats, setStreamStats] = useState<StreamStats | null>(null);
  const [streamState, setStreamState] = useState<string>('idle');
  const [displays, setDisplays] = useState<DisplayScreen[]>([]);
  const [localPhysicalDisplays, setLocalPhysicalDisplays] = useState<DisplayScreen[]>([
    { id: 1, name: 'Primary Display 1', resolution: '1920x1080', isVirtual: false, isPrimary: true }
  ]);
  const [activeDisplayId, setActiveDisplayId] = useState(1);
  const [is10Bit, setIs10Bit] = useState(true);
  const [multiView, setMultiView] = useState<'single' | 'dual-split'>('single');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<BiDeskStreamSession | null>(null);
  const hostServiceRef = useRef<BiDeskHostService | null>(null);

  // ── Discovery State ─────────────────────────────────────────────────────
  const [computers, setComputers] = useState<Computer[]>([]);
  const presenceChRef = useRef<any>(null);
  const [isHostingActive, setIsHostingActive] = useState(false);

  // ── Peer ID (persistent per device) ─────────────────────────────────────
  const [myPeerId] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('bidesk_my_peer_id') : null;
    if (saved) return saved;
    const isMac = navigator.userAgent.includes('Mac');
    const isWin = navigator.userAgent.includes('Win');
    const tag = isWin ? 'win' : isMac ? 'mac' : 'pc';
    const id = `bidesk-${tag}-${Math.random().toString(36).substring(2, 8)}`;
    if (typeof window !== 'undefined') localStorage.setItem('bidesk_my_peer_id', id);
    return id;
  });

  // ── Settings ────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState(() => {
    const vddOn = typeof window !== 'undefined' && localStorage.getItem('bidesk_vdd_enabled') === 'true';
    return {
      renderer: navigator.userAgent.includes('Win') ? 'DirectX 11 (Windows)' : 'Metal (macOS Default)',
      vsync: 'Off (Lowest Latency)',
      decoder: 'Hardware Accelerated',
      overlayHotkey: 'Ctrl+Shift+M',
      immersiveMode: true,
      hostingEnabled: true,
      virtualDisplaysEnabled: vddOn,
      virtualDisplayResolution: (typeof window !== 'undefined' ? localStorage.getItem('bidesk_vdd_res') : null) || '1920x1080',
      virtualDisplayRefreshRate: Number((typeof window !== 'undefined' ? localStorage.getItem('bidesk_vdd_hz') : null) || '60'),
      resolutionMode: 'Auto (Recommended)',
      bandwidthLimit: 35,
      fpsLimit: 60,
      resolution: 'Match Client',
      colorFormat: 'YUV 4:4:4 (Parsec Warp Style)',
      mouseMode: 'Relative (Gaming)',
      controllerMapping: 'Auto (Xbox Layout)',
      audioQuality: 'High (Opus 48kHz)'
    };
  });

  // Query local displays on mount
  useEffect(() => {
    detectLocalPhysicalDisplays().then((d) => {
      if (d && d.length > 0) setLocalPhysicalDisplays(d);
    });
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load app config (maintenance / kill-switch)
  useEffect(() => {
    supabase.from('app_config').select('*').single().then(({ data }) => {
      if (data) setAppConfig(data);
    }).catch(() => {});
  }, []);

  // ════════════════════════════════════════════════════════════════════════
  // AUTO-HOSTING: Start host service automatically when logged in or guest active
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!session?.user?.id) {
      hostServiceRef.current?.stop();
      hostServiceRef.current = null;
      setIsHostingActive(false);
      return;
    }

    const start = async () => {
      try {
        if (!hostServiceRef.current) {
          const svc = new BiDeskHostService(myPeerId, session.user.id);
          await svc.start();
          hostServiceRef.current = svc;
        }
        setIsHostingActive(true);
      } catch (e) {
        console.error('[BiDesk] Auto-host init exception:', e);
      }
    };
    start();
  }, [session?.user?.id, myPeerId]);

  // ════════════════════════════════════════════════════════════════════════
  // DISCOVERY: Multi-Transport Presence Mesh (Supabase Realtime + BroadcastChannel)
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const ch = supabase.channel('bidesk_devices_presence', {
      config: { broadcast: { self: true }, private: false }
    });

    const localBc = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('bidesk_devices_presence_mesh')
      : null;

    const peerMap = new Map<string, { computer: Computer; lastSeen: number }>();

    const refresh = () => {
      setComputers(Array.from(peerMap.values()).map((e) => e.computer));
    };

    const prune = () => {
      const cutoff = Date.now() - 15000;
      let changed = false;
      peerMap.forEach((entry, pid) => {
        if (entry.lastSeen < cutoff) { peerMap.delete(pid); changed = true; }
      });
      if (changed) refresh();
    };

    const handleHeartbeatPayload = (payload: any) => {
      if (!payload?.peer_id || payload.peer_id === myPeerId) return;

      peerMap.set(payload.peer_id, {
        computer: {
          id: payload.peer_id,
          name: payload.name || `Computer ${payload.peer_id.slice(-4)}`,
          peer_id: payload.peer_id,
          is_online: true,
          system_info: payload.system_info,
          settings: payload.settings,
          last_seen: new Date(payload.heartbeat_at || Date.now()).toISOString()
        },
        lastSeen: Date.now()
      });
      refresh();
    };

    ch.on('broadcast', { event: 'heartbeat' }, ({ payload }: any) => {
      handleHeartbeatPayload(payload);
    });

    if (localBc) {
      localBc.onmessage = (ev) => {
        if (ev.data?.event === 'heartbeat') handleHeartbeatPayload(ev.data.payload);
        else if (ev.data?.event === 'peer-offline' && ev.data.payload?.peer_id) {
          peerMap.delete(ev.data.payload.peer_id);
          refresh();
        }
      };
    }

    ch.on('broadcast', { event: 'peer-offline' }, ({ payload }: any) => {
      if (!payload?.peer_id) return;
      peerMap.delete(payload.peer_id);
      refresh();
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        presenceChRef.current = ch;
        sendHeartbeat();
      }
    });

    const hb = setInterval(() => { sendHeartbeat(); prune(); }, 4000);
    const pr = setInterval(prune, 8000);

    return () => {
      clearInterval(hb);
      clearInterval(pr);
      presenceChRef.current = null;
      ch.unsubscribe();
      if (localBc) localBc.close();
    };
  }, [session?.user?.id, myPeerId, isHostingActive]);

  // Broadcast this device's presence
  const sendHeartbeat = useCallback(() => {
    const isMac = navigator.userAgent.includes('Mac');
    const isWin = navigator.userAgent.includes('Win');
    const osName = isWin ? 'Windows 11' : isMac ? 'macOS Sequoia' : navigator.platform;
    const hostname = isWin ? 'Windows PC' : isMac ? 'MacBook Pro' : 'BiDesk Machine';
    const emailPrefix = session?.user?.email?.split('@')[0] || `Device-${myPeerId.slice(-4)}`;

    const payload = {
      peer_id: myPeerId,
      user_id: session?.user?.id || 'guest',
      name: `${hostname} (${emailPrefix})`,
      is_online: true,
      is_hosting: isHostingActive,
      heartbeat_at: Date.now(),
      system_info: {
        os: osName,
        gpu: isWin ? 'DirectX 11 / NVENC Accelerated' : 'Apple Metal Hardware Accelerated',
        resolution: `${window.screen.width}x${window.screen.height}`
      },
      settings: {
        fps: settings.fpsLimit,
        bitrate: settings.bandwidthLimit,
        codec: 'h264',
        color: '4:4:4'
      }
    };

    if (presenceChRef.current) {
      try {
        presenceChRef.current.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload
        });
      } catch (_) {}
    }

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('bidesk_devices_presence_mesh');
        bc.postMessage({ event: 'heartbeat', payload });
        bc.close();
      } catch (_) {}
    }
  }, [session?.user?.id, session?.user?.email, myPeerId, isHostingActive, settings.fpsLimit, settings.bandwidthLimit]);

  // Notify peers when app closes
  useEffect(() => {
    const onExit = () => {
      try {
        presenceChRef.current?.send({
          type: 'broadcast', event: 'peer-offline', payload: { peer_id: myPeerId }
        });
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('bidesk_devices_presence_mesh');
          bc.postMessage({ event: 'peer-offline', payload: { peer_id: myPeerId } });
          bc.close();
        }
      } catch {}
    };
    window.addEventListener('beforeunload', onExit);
    window.addEventListener('pagehide', onExit);
    return () => {
      window.removeEventListener('beforeunload', onExit);
      window.removeEventListener('pagehide', onExit);
    };
  }, [myPeerId]);

  // Toggle hosting on/off
  const toggleHosting = async () => {
    if (hostServiceRef.current) {
      hostServiceRef.current.stop();
      hostServiceRef.current = null;
      setIsHostingActive(false);
    } else {
      try {
        const svc = new BiDeskHostService(myPeerId, session?.user?.id || 'guest');
        await svc.start();
        hostServiceRef.current = svc;
        setIsHostingActive(true);
      } catch (e) {
        console.error('[BiDesk] Host start failed:', e);
      }
    }
    setTimeout(sendHeartbeat, 100);
  };

  // ════════════════════════════════════════════════════════════════════════
  // WEBRTC CONNECTION & STREAM MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════

  const startStream = (host: Computer) => {
    if (host.peer_id === myPeerId) {
      alert('Cannot connect to your own device!');
      return;
    }

    setActiveHost(host);
    setStreamState('connecting');
    setHasVideoTrack(false);

    const userId = session?.user?.id || `guest-${myPeerId}`;
    const rtc = new BiDeskStreamSession(host.peer_id, myPeerId, userId);

    if (settings.virtualDisplaysEnabled) {
      const virtuals = displays.filter((d) => d.isVirtual);
      rtc.displays = [...rtc.displays.filter((d) => !d.isVirtual), ...virtuals];
    }
    setDisplays([...rtc.displays]);
    setActiveDisplayId(1);
    setIs10Bit(rtc.is10BitEnabled);

    rtc.onStats((s) => setStreamStats(s));
    rtc.onScreens((s) => setDisplays([...s]));
    rtc.onStateChangeCb((s) => {
      setStreamState(s);
      console.log('[BiDesk] Stream state:', s);
    });

    sessionRef.current = rtc;
  };

  const handleQuickConnect = (targetPeerId: string) => {
    const cleanId = targetPeerId.trim();
    if (!cleanId) return;
    if (cleanId === myPeerId) {
      alert('Cannot connect to your own device!');
      return;
    }
    const targetHost: Computer = {
      id: cleanId,
      name: `Remote Machine (${cleanId})`,
      peer_id: cleanId,
      is_online: true,
      last_seen: new Date().toISOString(),
      system_info: {
        os: 'Remote Host',
        gpu: 'Hardware Accelerated',
        resolution: '1920x1080'
      },
      settings: {
        fps: 60,
        bitrate: 35,
        codec: 'h264',
        color: '4:4:4'
      }
    };
    startStream(targetHost);
  };

  useEffect(() => {
    if (activeHost && sessionRef.current && videoRef.current) {
      const vid = videoRef.current;
      vid.onloadeddata = () => setHasVideoTrack(true);
      sessionRef.current.start(vid)
        .then(() => vid.play().catch(() => {}))
        .catch((e) => {
          console.error('[BiDesk] Stream start failed:', e);
          setStreamState('error');
        });
    }
  }, [activeHost]);

  const stopStream = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setActiveHost(null);
    setStreamStats(null);
    setHasVideoTrack(false);
    setStreamState('idle');
  };

  const handleDisplaySwitch = (id: number) => {
    setActiveDisplayId(id);
    sessionRef.current?.switchDisplay(id);
  };

  const handleToggleMultiView = () => {
    setMultiView((prev) => (prev === 'single' ? 'dual-split' : 'single'));
  };

  const handleToggle10Bit = () => {
    setIs10Bit((p) => {
      const next = !p;
      if (sessionRef.current) sessionRef.current.is10BitEnabled = next;
      return next;
    });
  };

  // Input Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * 1920;
    const y = ((e.clientY - rect.top) / rect.height) * 1080;
    sessionRef.current?.sendMouseMove(x, y);
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => sessionRef.current?.sendMouseDown(e.button);
  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => sessionRef.current?.sendMouseUp(e.button);

  const toggleAppFullscreen = async () => {
    try {
      const tw = (window as any).__TAURI__?.window || (window as any).__TAURI_INTERNALS__;
      if (tw?.getCurrentWindow) {
        const w = tw.getCurrentWindow();
        const full = await w.isFullscreen();
        await w.setFullscreen(!full);
        setIsFullscreen(!full);
        return;
      }
    } catch (_) {}
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    hostServiceRef.current?.stop();
    hostServiceRef.current = null;
    setIsHostingActive(false);
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
  };

  // ── 1. Kill Switch / Maintenance Screen ──────────────────────────────────
  if (appConfig?.kill_switch || appConfig?.is_maintenance_mode) {
    return (
      <div className="h-screen w-screen bg-[#0A0D14] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-[#121620] border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Emergency Maintenance Active</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            {appConfig.maintenance_message || 'Bi Desk is undergoing maintenance. Connections will resume shortly.'}
          </p>
          <div className="text-[11px] font-mono text-gray-500 border-t border-gray-800 pt-4">
            Security Kill-Switch Engaged (v{appConfig.min_supported_version || '1.0.0'})
          </div>
        </div>
      </div>
    );
  }

  // ── 2. Auth Modal Screen ────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="h-screen w-screen bg-[#0A0D14] flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-sm w-full bg-[#121620] border border-[#202531] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center mb-3 shadow-lg shadow-red-500/25">
              <Power className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Bi Desk Remote</h1>
            <p className="text-xs text-gray-400 mt-1">Ultra low-latency remote desktop & cloud gaming</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Email Address</label>
              <input type="email" required placeholder="name@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1F242E] border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Password</label>
              <input type="password" required placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1F242E] border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition" />
            </div>
            <button type="submit" disabled={authLoading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-2 mt-6">
              {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" />
                : authMode === 'login' ? <><LogIn className="w-4 h-4" /> Sign In</>
                : <><UserPlus className="w-4 h-4" /> Create Free Account</>}
            </button>
          </form>

          {/* Instant Guest Mode Button */}
          <div className="mt-4 pt-4 border-t border-gray-800 text-center">
            <button
              type="button"
              onClick={() => {
                setSession({
                  user: {
                    id: `guest-${myPeerId}`,
                    email: `guest@bidesk.local`
                  }
                });
              }}
              className="w-full py-2.5 bg-[#1F242E] hover:bg-[#2A303D] border border-gray-700/60 rounded-xl text-xs font-semibold text-gray-200 hover:text-white transition flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Continue in Guest / Local Mode (Instant Connect)
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            {authMode === 'login' ? (
              <>Don't have an account? <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="text-red-400 hover:text-red-300 font-semibold">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-red-400 hover:text-red-300 font-semibold">Sign in</button></>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Active Stream Screen ────────────────────────────────────────────
  if (activeHost) {
    const isStreamRendering = hasVideoTrack || streamState === 'connected';

    return (
      <div tabIndex={0}
        onKeyDown={(e) => sessionRef.current?.sendKeyDown(e.key, e.code)}
        onKeyUp={(e) => sessionRef.current?.sendKeyUp(e.key, e.code)}
        className="relative h-screen w-screen bg-black overflow-hidden flex items-center justify-center select-none outline-none font-sans">
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video ref={videoRef} autoPlay playsInline muted
            onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-contain cursor-crosshair z-10" />
        </div>

        {!isStreamRendering && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <Monitor className="w-24 h-24 text-gray-600 animate-pulse" />
            <h2 className="text-xl font-bold mt-4 text-white">{activeHost.name}</h2>
            <p className="text-xs text-gray-400 mt-1">
              {streamState === 'connecting' ? 'Initiating ultra-low latency WebRTC stream...'
                : streamState === 'signaling' ? 'Establishing P2P handshake with remote host...'
                : `Hardware Stream Connected • ${activeHost.system_info?.gpu || 'Direct GPU Pipeline'}`}
            </p>
            {streamState === 'error' && (
              <p className="text-xs text-red-400 mt-2">Connection timed out. Ensure the host is active and hosting is enabled.</p>
            )}
          </div>
        )}

        {/* Floating Parsec-style HUD Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#161920]/95 backdrop-blur-md border border-gray-700/70 rounded-2xl px-5 py-2.5 flex items-center gap-4 shadow-2xl z-50 text-xs font-mono">
          <div className="flex items-center gap-2 text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold font-sans">{activeHost.name}</span>
          </div>
          <div className="flex items-center gap-3.5 text-gray-300 border-l border-r border-gray-700/60 px-4">
            <span className="text-emerald-400 font-bold">{streamStats?.fps || 60} FPS</span>
            <span className="text-amber-400 font-bold">{streamStats?.latencyMs || 5.8} ms</span>
            <span className="text-blue-400">{streamStats?.bitrateMbps || 32.4} Mbps</span>
            <span className="text-purple-400 font-semibold">{streamStats?.colorDepth || (is10Bit ? '10-bit HDR10' : '8-bit SDR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1F242E] rounded-lg p-0.5 border border-gray-700/50 gap-0.5">
              {(displays.length > 0 ? displays : [{ id: 1, name: 'D1' }]).map((disp) => (
                <div key={disp.id} onClick={() => handleDisplaySwitch(disp.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    activeDisplayId === disp.id ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                  <span>D{disp.id}</span>
                </div>
              ))}
            </div>
            <button onClick={handleToggle10Bit}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium flex items-center gap-1.5 transition border ${
                is10Bit ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' : 'bg-[#1F242E] border-gray-700/50 text-gray-400 hover:text-white'}`}>
              <Sparkles className="w-3.5 h-3.5" />{is10Bit ? '10-bit' : '8-bit'}
            </button>
            <button onClick={toggleAppFullscreen}
              className="p-1.5 rounded-lg bg-[#1F242E] hover:bg-[#2A303D] border border-gray-700/50 text-gray-300 hover:text-white transition"
              title="Toggle Fullscreen">
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button onClick={stopStream}
            className="p-1.5 rounded-full hover:bg-red-600/30 text-red-400 hover:text-red-300 transition ml-1"
            title="Disconnect Session">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── 4. Main Authenticated App ──────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex bg-[#0F1115] text-gray-200 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <aside className="w-16 bg-[#161920] border-r border-[#222733] flex flex-col items-center py-4 justify-between select-none">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Power className="w-5 h-5 text-white" />
          </div>
          <button onClick={() => setTab('computers')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              tab === 'computers' ? 'bg-[#1F242E] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#1A1E27]'}`}
            title="Computers">
            <Monitor className="w-5 h-5" />
          </button>
          <button onClick={() => setTab('settings')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              tab === 'settings' ? 'bg-[#1F242E] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#1A1E27]'}`}
            title="Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={toggleAppFullscreen}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1A1E27] transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={handleLogout}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-[#1A1E27] transition"
            title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-[#0F1115]">
        {tab === 'computers' && (
          <div className="flex-1 p-8 overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Computers
                  <span className="text-xs font-normal px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {session.user?.email || 'Guest Network'}
                  </span>
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Ultra-low latency remote gaming rigs & workstations ({localPhysicalDisplays.length} Display{localPhysicalDisplays.length > 1 ? 's' : ''} detected)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isHostingActive && (
                  <button
                    onClick={async () => {
                      if (hostServiceRef.current) {
                        await hostServiceRef.current.requestNativeScreenCapture();
                      }
                    }}
                    className="px-3.5 py-2 bg-[#1F242E] hover:bg-[#2A303D] border border-red-500/30 rounded-xl text-xs font-medium flex items-center gap-2 transition text-red-400 shadow-sm"
                    title="Choose display to stream live"
                  >
                    <MonitorUp className="w-3.5 h-3.5" /> Share Screen
                  </button>
                )}
                <button onClick={toggleHosting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
                    isHostingActive
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-lg shadow-red-500/20'}`}>
                  <Radio className="w-3.5 h-3.5" />
                  {isHostingActive ? '● Host Active (Discoverable)' : 'Start Hosting This PC'}
                </button>
                <button onClick={() => sendHeartbeat()}
                  className="px-3.5 py-2 bg-[#1F242E] hover:bg-[#2A303D] border border-gray-700/50 rounded-xl text-xs font-medium flex items-center gap-2 transition text-gray-300">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Quick Connect & My ID Bar */}
            <div className="mb-8 p-4 rounded-2xl bg-[#141822] border border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">Your Bi Desk ID:</span>
                <span className="text-sm font-mono font-bold text-white px-3 py-1 bg-[#1A1F2B] rounded-lg border border-gray-700/60 flex items-center gap-2">
                  {myPeerId}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(myPeerId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="p-1 hover:bg-gray-700/50 rounded transition"
                    title="Copy ID to Clipboard"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                  </button>
                </span>
                {copiedId && <span className="text-xs text-emerald-400 font-medium">Copied!</span>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter Partner's Peer ID..."
                  value={quickConnectId}
                  onChange={(e) => setQuickConnectId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickConnectId.trim()) {
                      handleQuickConnect(quickConnectId);
                    }
                  }}
                  className="px-3.5 py-2 bg-[#0F1218] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 w-64 font-mono"
                />
                <button
                  onClick={() => handleQuickConnect(quickConnectId)}
                  disabled={!quickConnectId.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Connect
                </button>
              </div>
            </div>

            {/* Computers List */}
            {computers.length === 0 ? (
              <div className="border border-dashed border-gray-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 bg-[#13161C]/50">
                <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Other Computers Found</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Enter your partner's Peer ID in the Quick Connect box above, or open Bi Desk on your other Mac/PC with hosting enabled.
                </p>
                {!isHostingActive && (
                  <button onClick={toggleHosting}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/25 transition inline-flex items-center gap-2">
                    <Radio className="w-4 h-4" /> Start Hosting This PC
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {computers.map((comp) => {
                  const isMine = comp.peer_id === myPeerId;
                  return (
                    <div key={comp.peer_id}
                      className="group bg-[#141822] hover:bg-[#181D29] border border-gray-800/80 hover:border-red-500/40 rounded-2xl p-5 transition flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-[#1C2230] flex items-center justify-center text-red-400">
                            <Laptop className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Ready
                            </span>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-red-400 transition mb-1">{comp.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mb-4">{comp.peer_id}</p>
                        <div className="bg-[#0F1218] rounded-xl p-3 border border-gray-800/60 space-y-1.5 mb-4 text-xs font-mono text-gray-300">
                          <div className="flex justify-between">
                            <span className="text-gray-500">OS:</span>
                            <span>{comp.system_info?.os || 'Desktop OS'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">GPU:</span>
                            <span className="text-emerald-400">{comp.system_info?.gpu || 'Hardware Accelerated'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Display:</span>
                            <span>{comp.system_info?.resolution || '1080p @ 60 FPS'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-3">
                        <button onClick={() => startStream(comp)}
                          disabled={isMine}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-1.5">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {isMine ? 'This Machine' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Settings Sidebar */}
            <div className="w-56 bg-[#121620] border-r border-[#202531] p-4 flex flex-col gap-1 select-none">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 py-2">Configuration</h2>
              {[
                { id: 'client', label: 'Client', icon: Sliders },
                { id: 'host', label: 'Host & Streaming', icon: Monitor },
                { id: 'input', label: 'Input & Controllers', icon: Cpu },
                { id: 'network', label: 'Network & Signaling', icon: Radio },
                { id: 'account', label: 'Account', icon: CheckCircle2 }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setSettingsCategory(item.id as any)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition ${
                      settingsCategory === item.id ? 'bg-[#1F242E] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#181C26]'}`}>
                    <Icon className="w-4 h-4 text-red-500" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-8 overflow-y-auto max-w-3xl">
              {settingsCategory === 'client' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Renderer & Display</p>
                    <SettingRow label="Renderer" desc="Hardware accelerated renderer used to display video frames.">
                      <select value={settings.renderer} onChange={(e) => setSettings({ ...settings, renderer: e.target.value })}
                        className="bg-[#1F242E] border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white">
                        <option>Metal (macOS Default)</option>
                        <option>DirectX 11 (Windows)</option>
                        <option>Vulkan (High Performance)</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="VSync" desc="Synchronize frame presentation to display refresh rate.">
                      <select value={settings.vsync} onChange={(e) => setSettings({ ...settings, vsync: e.target.value })}
                        className="bg-[#1F242E] border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white">
                        <option>Off (Lowest Latency)</option>
                        <option>On</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="Decoder" desc="Hardware acceleration uses GPU for decoding.">
                      <select value={settings.decoder} onChange={(e) => setSettings({ ...settings, decoder: e.target.value })}
                        className="bg-[#1F242E] border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white">
                        <option>Hardware Accelerated</option>
                        <option>Software (CPU)</option>
                      </select>
                    </SettingRow>
                  </div>
                </div>
              )}

              {settingsCategory === 'host' && (
                <div className="space-y-6">
                  <SettingRow label="Hosting Status" desc="Allow remote devices to discover and connect to this computer.">
                    <button onClick={toggleHosting}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        isHostingActive ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600/30'}`}>
                      {isHostingActive ? '● Hosting Active' : 'Start Hosting Now'}
                    </button>
                  </SettingRow>
                  <SettingRow label="FPS Limit" desc="Maximum frames per second for video capture.">
                    <div className="flex items-center gap-4 w-48">
                      <input type="range" min="30" max="144" step="30" value={settings.fpsLimit}
                        onChange={(e) => setSettings({ ...settings, fpsLimit: Number(e.target.value) })}
                        className="w-full accent-red-500" />
                      <span className="text-sm font-semibold w-12 text-right">{settings.fpsLimit}</span>
                    </div>
                  </SettingRow>
                  <SettingRow label="Bandwidth Limit" desc={`${settings.bandwidthLimit} Mbps (Dynamic stream bitrate)`}>
                    <div className="flex items-center gap-4 w-48">
                      <input type="range" min="5" max="100" value={settings.bandwidthLimit}
                        onChange={(e) => setSettings({ ...settings, bandwidthLimit: Number(e.target.value) })}
                        className="w-full accent-red-500" />
                      <span className="text-sm font-semibold w-12 text-right">{settings.bandwidthLimit}M</span>
                    </div>
                  </SettingRow>
                </div>
              )}

              {settingsCategory === 'input' && (
                <div className="space-y-6">
                  <SettingRow label="Mouse Mode" desc="Relative mode for gaming, Absolute for desktop productivity.">
                    <select value={settings.mouseMode} onChange={(e) => setSettings({ ...settings, mouseMode: e.target.value })}
                      className="bg-[#1F242E] border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white">
                      <option>Relative (Gaming)</option>
                      <option>Absolute (Desktop)</option>
                    </select>
                  </SettingRow>
                  <SettingRow label="Virtual Gamepads (ViGEmBus)" desc="Emulate Xbox 360 / DualShock 4 controllers over WebRTC.">
                    <span className="text-sm text-emerald-400 font-medium">Ready (4 Controller Slots)</span>
                  </SettingRow>
                </div>
              )}

              {settingsCategory === 'network' && (
                <div className="space-y-6">
                  <div className="bg-[#141822] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white">Custom Supabase Signaling (Optional)</h3>
                    <p className="text-xs text-gray-400">
                      Configure your own Supabase project URL and Anon key if you want private self-hosted signaling.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] uppercase text-gray-400 mb-1">Project URL</label>
                        <input
                          type="text"
                          placeholder="https://your-project.supabase.co"
                          value={customSupaUrl}
                          onChange={(e) => setCustomSupaUrl(e.target.value)}
                          className="w-full bg-[#1F242E] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase text-gray-400 mb-1">Anon Key</label>
                        <input
                          type="text"
                          placeholder="eyJhbGci..."
                          value={customSupaKey}
                          onChange={(e) => setCustomSupaKey(e.target.value)}
                          className="w-full bg-[#1F242E] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (customSupaUrl && customSupaKey) {
                            updateSupabaseConfig(customSupaUrl, customSupaKey);
                            alert('Supabase credentials updated successfully!');
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsCategory === 'account' && (
                <div className="space-y-6">
                  <SettingRow label="Account Status" desc="Your active Bi Desk session.">
                    <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> {session.user?.email}
                    </div>
                  </SettingRow>
                  <button onClick={handleLogout}
                    className="px-4 py-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-[#202531]">
      <div className="pr-6">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <p className="text-xs text-gray-400 mt-0.5 max-w-lg">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
