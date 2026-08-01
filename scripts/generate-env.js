// scripts/generate-env.js
// Dijalankan otomatis oleh Vercel (lihat vercel.json > buildCommand).
// Menulis public/env.js berisi SUPABASE_URL & SUPABASE_ANON_KEY dari
// Environment Variables project Vercel, agar tidak perlu hardcode di kode.
const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

if (!url || !anonKey) {
  console.warn('[generate-env] SUPABASE_URL / SUPABASE_ANON_KEY belum diset di Environment Variables Vercel.');
}

const content = `window.__ENV__ = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey })};\n`;
fs.writeFileSync('public/env.js', content);
console.log('[generate-env] public/env.js berhasil dibuat.');
