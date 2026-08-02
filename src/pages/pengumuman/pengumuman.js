// src/pages/pengumuman/pengumuman.js
// Fitur "Info & Pengumuman" — dipakai untuk 3 kebutuhan sekaligus
// (Pengumuman biasa, Surat Edaran, Himbauan). Ketiganya memakai satu
// tabel `pengumuman` (skema sudah ada sejak 001_schema.sql) — bedanya
// hanya label "Jenis" yang diselipkan di awal judul, karena tabel
// tidak punya kolom `jenis` terpisah. Kalau ke depan perlu filter per
// jenis di database (bukan cuma tampilan), tinggal tambah kolom
// `jenis varchar(20)` + migrasi kecil, tanpa mengubah struktur besar.
import { supabase } from '../../lib/supabaseClient.js';
import { requireLogin } from '../../lib/auth.js';
import { formatTanggalIndo } from '../../lib/format.js';
import { canManage } from '../../lib/rbac.js';

let profileAktif = null;
let modal = null;
let semuaPengumuman = [];
let filterAktif = '';

export async function init() {
  const profile = await requireLogin();
  if (!profile) return;
  profileAktif = profile;

  const bisaTulis = canManage('pengumuman', profile.role);

  await muatPengumuman();
  renderList();
  setupFilter();

  if (bisaTulis) {
    document.getElementById('pg-fab').style.display = 'flex';
    modal = new bootstrap.Modal(document.getElementById('modalBuatPengumuman'));
    document.getElementById('pg-fab').addEventListener('click', () => modal.show());
    document.getElementById('pg-btn-simpan').addEventListener('click', simpanPengumuman);
  }
}

async function muatPengumuman() {
  // RLS (pengumuman_select_authenticated) sudah membatasi hanya
  // pengguna login yang bisa SELECT — tidak perlu filter tambahan
  // di sini untuk keamanan, hanya untuk tampilan/urutan.
  const { data, error } = await supabase
    .from('pengumuman')
    .select('id, judul, isi, target_grup, created_at, dibuat_oleh, users:dibuat_oleh ( nama_lengkap )')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Gagal memuat pengumuman:', error.message);
    semuaPengumuman = [];
    return;
  }
  semuaPengumuman = data || [];
}

function setupFilter() {
  document.querySelectorAll('#pg-filter-target .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#pg-filter-target .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterAktif = chip.dataset.target || '';
      renderList();
    });
  });
}

const LABEL_TARGET = {
  semua_warga: 'Semua Warga',
  pengurus_rt: 'Pengurus RT',
  pengurus_takmir: 'Pengurus Takmir',
  jamaah_tertentu: 'Jamaah Tertentu',
};

function renderList() {
  const el = document.getElementById('pg-list');
  const data = filterAktif ? semuaPengumuman.filter(p => p.target_grup === filterAktif) : semuaPengumuman;

  if (!data.length) {
    el.innerHTML = `<div class="text-caption text-center py-4">Belum ada pengumuman.</div>`;
    return;
  }

  el.innerHTML = data.map(p => `
    <div class="card card-body mb-3">
      <div class="d-flex justify-content-between align-items-start mb-1">
        <h2 class="section-title mb-0">${escapeHtml(p.judul)}</h2>
        <span class="badge" style="background:var(--color-secondary-soft,#eef2f1);color:var(--color-secondary,#0f6b5c);">${LABEL_TARGET[p.target_grup] || p.target_grup}</span>
      </div>
      <div class="text-caption mb-2">${formatTanggalIndo(p.created_at)} · ${escapeHtml(p.users?.nama_lengkap || 'Pengurus')}</div>
      <div style="white-space:pre-wrap;">${escapeHtml(p.isi)}</div>
    </div>
  `).join('');
}

async function simpanPengumuman() {
  const jenis = document.getElementById('pg_jenis').value;
  const judulMentah = document.getElementById('pg_judul').value.trim();
  const isi = document.getElementById('pg_isi').value.trim();
  const target = document.getElementById('pg_target').value;

  if (!judulMentah || !isi) {
    alert('Judul dan isi wajib diisi.');
    return;
  }

  // Sematkan jenis di awal judul, mis. "[Surat Edaran] Jadwal Kerja Bakti"
  const judul = jenis === 'Pengumuman' ? judulMentah : `[${jenis}] ${judulMentah}`;

  const btn = document.getElementById('pg-btn-simpan');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const { error } = await supabase.from('pengumuman').insert({
    judul,
    isi,
    target_grup: target,
    dibuat_oleh: profileAktif.id,
  });

  btn.disabled = false;
  btn.textContent = 'Terbitkan';

  if (error) {
    alert('Gagal menyimpan: ' + error.message);
    return;
  }

  modal.hide();
  document.getElementById('pg_judul').value = '';
  document.getElementById('pg_isi').value = '';
  await muatPengumuman();
  renderList();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
