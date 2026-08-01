// =========================================================
// SILAT RT — src/lib/supabaseClient.js
// Inisialisasi Supabase client tunggal untuk seluruh aplikasi
// =========================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Nilai berikut diambil dari environment saat build/deploy.
// Untuk static hosting tanpa build step, nilai ini disuntikkan
// oleh Vercel lewat file /public/env.js yang di-generate saat deploy
// (lihat Tahap 12). Selama development lokal, isi langsung di sini.
const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || 'https://xxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
