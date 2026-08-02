// src/pages/undangan/undangan.js
// Fitur Undangan Takmir — buat undangan acara, pilih penerima dari
// warga, cetak PDF pakai kop Langgar (lib/pdf.js: cetakSuratTakmirPDF),
// dan kirim link WhatsApp per penerima.
//
// CATATAN KEAMANAN: RLS tabel surat_undangan & undangan_penerima saat
// ini masih punya klausa "OR auth.role() = 'authenticated'" yang
// membuat data undangan/penerima bisa terlihat lintas-langgar (lihat
// migrasi 013_optional_batasi_undangan_lintas_langgar.sql yang sudah
// disiapkan tapi belum diterapkan). Sekarang fitur ini sudah nyata
// dipakai per-langgar (pola sama seperti keuangan-takmir), jadi
// SANGAT DISARANKAN migrasi 013 diterapkan sekarang (uncomment bagian
// undangan_select_scope & undangan_penerima_select_scope).
import { supabase } from '../../lib/supabaseClient.js';
import { requireRole } from '../../lib/auth.js';
import { formatTanggalIndo } from '../../lib/format.js';
import { canManage } from '../../lib/rbac.js';
import { cetakSuratTakmirPDF } from '../../lib/pdf.js';
import { buildWaLink } from '../../lib/whatsapp.js';

const ALLOWED = ['Sekretaris Takmir', 'Ketua Takmir', 'Bendahara Takmir', 'Administrator'];
let profileAktif = null;
let langgarAktif = null;
let modal = null;
let semuaUndangan = [];
let semuaWarga = [];

export async function init() {
  const profile = await requireRole(ALLOWED);
  if (!profile) return;
  profileAktif = profile;

  await muatLanggarAktif();
  document.getElementById('un-langgar-nama').textContent = langgarAktif ? langgarAktif.nama_langgar : 'Belum terdaftar sebagai pengurus takmir aktif';

  const bisaTulis = canManage('undangan', profile.role) && langgarAktif;

  await muatUndangan();
  renderList();

  if (bisaTulis) {
    await muatWarga();
    renderChecklistWarga();
    document.getElementById('un-fab').style.display = 'flex';
    modal = new bootstrap.Modal(document.getElementById('modalBuatUndangan'));
    document.getElementById('un-fab').addEventListener('click', () => modal.show());
    document.getElementById('un-btn-simpan').addEventListener('click', simpanUndangan);
  }
}

async function muatLanggarAktif() {
  const { data, error } = await supabase
    .from('pengurus_takmir')
    .select('langgar_id, langgar:langgar_id (id, nama_langgar)')
    .eq('user_id', profileAktif.id)
    .is('tanggal_selesai', null)
    .limit(1)
    .maybeSingle();

  if (error || !data) { langgarAktif = null; return; }
  langgarAktif = data.langgar;
}

async function muatUndangan() {
  if (!langgarAktif) { semuaUndangan = []; return; }
  const { data, error } = await supabase
    .from('surat_undangan')
    .select('id, judul_acara, isi_undangan, tanggal_acara, status, undangan_penerima ( id, status_kirim, warga:warga_id ( id, nama, no_wa ) )')
    .eq('langgar_id', langgarAktif.id)
    .order('tanggal_acara', { ascending: false });

  if (error) { console.error(error.message); semuaUndangan = []; return; }
  semuaUndangan = data || [];
}

async function muatWarga() {
  // Terbatas RLS warga_select_scope (kk_id -> wilayah_rt_id akun pengurus).
  const { data, error } = await supabase
    .from('warga')
    .select('id, nama, no_wa')
    .order('nama');
  if (error) { console.error(error.message); semuaWarga = []; return; }
  semuaWarga = data || [];
}

function renderChecklistWarga() {
  const el = document.getElementById('un-list-warga');
  if (!semuaWarga.length) {
    el.innerHTML = `<div class="text-caption">Belum ada data warga.</div>`;
    return;
  }
  el.innerHTML = semuaWarga.map(w => `
    <div class="form-check">
      <input class="form-check-input un-warga-check" type="checkbox" value="${w.id}" id="un-w-${w.id}">
      <label class="form-check-label" for="un-w-${w.id}">${escapeHtml(w.nama)}</label>
    </div>
  `).join('');
}

function renderList() {
  const el = document.getElementById('un-list');
  if (!semuaUndangan.length) {
    el.innerHTML = `<div class="text-caption text-center py-4">Belum ada undangan.</div>`;
    return;
  }

  el.innerHTML = semuaUndangan.map(u => {
    const jumlahPenerima = u.undangan_penerima?.length || 0;
    const jumlahTerkirim = u.undangan_penerima?.filter(p => p.status_kirim === 'terkirim').length || 0;
    return `
      <div class="card card-body mb-3">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <h2 class="section-title mb-0">${escapeHtml(u.judul_acara)}</h2>
          <span class="badge" style="background:${u.status === 'terkirim' ? 'var(--color-success-container)' : 'var(--color-surface-alt)'};color:${u.status === 'terkirim' ? 'var(--color-success)' : 'var(--color-text-muted)'};">${u.status === 'terkirim' ? 'Terkirim' : 'Draf'}</span>
        </div>
        <div class="text-caption mb-2">${formatTanggalIndo(u.tanggal_acara)} · ${jumlahTerkirim}/${jumlahPenerima} terkirim</div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary un-btn-cetak" data-id="${u.id}">Cetak PDF</button>
          <button class="btn btn-sm btn-outline-secondary un-btn-kirim" data-id="${u.id}">Kirim via WhatsApp</button>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.un-btn-cetak').forEach(btn => btn.addEventListener('click', () => cetakUndangan(btn.dataset.id)));
  el.querySelectorAll('.un-btn-kirim').forEach(btn => btn.addEventListener('click', () => kirimUndangan(btn.dataset.id)));
}

async function simpanUndangan() {
  const judul_acara = document.getElementById('un_judul').value.trim();
  const isi_undangan = document.getElementById('un_isi').value.trim();
  const tanggal_acara = document.getElementById('un_tanggal').value;
  const idTerpilih = [...document.querySelectorAll('.un-warga-check:checked')].map(c => c.value);

  if (!judul_acara || !tanggal_acara) {
    alert('Judul acara dan tanggal wajib diisi.');
    return;
  }
  if (!idTerpilih.length) {
    alert('Pilih minimal satu penerima undangan.');
    return;
  }

  const btn = document.getElementById('un-btn-simpan');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const { data: undangan, error } = await supabase
    .from('surat_undangan')
    .insert({ langgar_id: langgarAktif.id, judul_acara, isi_undangan, tanggal_acara, dibuat_oleh: profileAktif.id })
    .select('id')
    .single();

  if (error) {
    alert('Gagal menyimpan undangan: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Simpan sebagai Draf';
    return;
  }

  const rows = idTerpilih.map(warga_id => ({ undangan_id: undangan.id, warga_id }));
  const { error: errorPenerima } = await supabase.from('undangan_penerima').insert(rows);
  if (errorPenerima) {
    alert('Undangan tersimpan, tapi gagal menyimpan sebagian daftar penerima: ' + errorPenerima.message);
  }

  btn.disabled = false;
  btn.textContent = 'Simpan sebagai Draf';
  modal.hide();
  document.getElementById('un_judul').value = '';
  document.getElementById('un_isi').value = '';
  document.getElementById('un_tanggal').value = '';
  document.querySelectorAll('.un-warga-check:checked').forEach(c => c.checked = false);

  await muatUndangan();
  renderList();
}

async function cetakUndangan(id) {
  const u = semuaUndangan.find(x => x.id === id);
  if (!u) return;
  await cetakSuratTakmirPDF({
    judul: u.judul_acara,
    isi: u.isi_undangan,
    tanggal_format: formatTanggalIndo(u.tanggal_acara),
    nama_penandatangan: langgarAktif?.nama_langgar ? '.........................' : '.........................',
    jabatan_penandatangan: 'Ketua Takmir',
  });
}

async function kirimUndangan(id) {
  const u = semuaUndangan.find(x => x.id === id);
  if (!u || !u.undangan_penerima?.length) return;

  for (const p of u.undangan_penerima) {
    if (!p.warga?.no_wa) continue;
    const pesan = `Assalamu'alaikum ${p.warga.nama},\n\nDengan hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada:\n\n${u.judul_acara}\nTanggal: ${formatTanggalIndo(u.tanggal_acara)}\n\n${u.isi_undangan || ''}\n\nTerima kasih — Takmir ${langgarAktif?.nama_langgar || ''}`;
    window.open(buildWaLink(p.warga.no_wa, pesan), '_blank');
  }

  await supabase.from('undangan_penerima').update({ status_kirim: 'terkirim' }).eq('undangan_id', id);
  await supabase.from('surat_undangan').update({ status: 'terkirim' }).eq('id', id);

  await muatUndangan();
  renderList();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
