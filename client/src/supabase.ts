import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://wzxxxppjautoferbgima.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eHh4cHBqYXV0b2ZlcmJnaW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDE3MTcsImV4cCI6MjEwNzM3NzcxN30.ZZ-_9-v7NGi5vk18IYsTTBZfzNMGvpanGrdEMOn0Yv8';

function getStoredUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bidesk_supabase_url') || DEFAULT_SUPABASE_URL;
  }
  return DEFAULT_SUPABASE_URL;
}

function getStoredKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bidesk_supabase_key') || DEFAULT_SUPABASE_ANON_KEY;
  }
  return DEFAULT_SUPABASE_ANON_KEY;
}

export let supabase: SupabaseClient = createClient(getStoredUrl(), getStoredKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bidesk_supabase_url', url);
    localStorage.setItem('bidesk_supabase_key', key);
  }
  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export interface Computer {
  id: string;
  name: string;
  peer_id: string;
  is_online: boolean;
  last_seen: string;
  system_info: {
    os?: string;
    gpu?: string;
    resolution?: string;
  };
  settings: {
    fps: number;
    bitrate: number;
    codec: string;
    color: string;
  };
}

export interface AppConfig {
  is_maintenance_mode: boolean;
  maintenance_message: string;
  min_supported_version: string;
  latest_version: string;
  kill_switch: boolean;
}
