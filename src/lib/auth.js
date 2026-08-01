// =========================================================
// SILAT RT — src/lib/auth.js
// Login berbasis USERNAME (bukan email) — lihat revisi 05d.
// Frontend menyusun email sintetis "{username}@silatrt.local"
// sebelum memanggil Supabase Auth. Pengguna tidak pernah melihat ini.
// =========================================================
import { supabase } from './supabaseClient.js';

const EMAIL_DOMAIN = 'silatrt.local';

/** Bersihkan input username: huruf kecil, hanya a-z 0-9 titik */
function normalizeUsername(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '');
}

/**
 * Login dengan username + password.
 * @param {string} username - mis. "ketua.rt", "sekretaris.lam"
 * @param {string} password
 * @returns {Promise<{ user: object, profile: object }>}
 */
export async function loginWithUsername(username, password) {
  const clean = normalizeUsername(username);
  if (clean.length < 3) {
    throw new Error('Username minimal 3 karakter (huruf kecil, angka, titik).');
  }

  const email = `${clean}@${EMAIL_DOMAIN}`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Pesan error digeneralisasi agar tidak membocorkan apakah username ada atau tidak
    throw new Error('Username atau kata sandi salah. Silakan coba lagi.');
  }

  const profile = await getCurrentProfile();
  return { user: data.user, profile };
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.hash = '#/login';
}

/** Ambil profil (public.users + role) dari pengguna yang sedang login */
export async function getCurrentProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData?.session?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, username, nama_lengkap, no_wa, foto_url, wilayah_rt_id,
      roles ( nama_role )
    `)
    .eq('id', uid)
    .single();

  if (error) {
    console.error('Gagal memuat profil pengguna:', error.message);
    return null;
  }
  return { ...data, role: data.roles?.nama_role };
}

/** Guard: panggil di setiap halaman yang butuh login */
export async function requireLogin() {
  const profile = await getCurrentProfile();
  if (!profile) {
    window.location.hash = '#/login';
    return null;
  }
  return profile;
}

/** Guard: panggil di halaman yang dibatasi role tertentu */
export async function requireRole(allowedRoles = []) {
  const profile = await requireLogin();
  if (!profile) return null;
  if (!allowedRoles.includes(profile.role)) {
    window.location.hash = '#/tidak-diizinkan';
    return null;
  }
  return profile;
}
