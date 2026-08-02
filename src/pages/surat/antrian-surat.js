// src/pages/surat/antrian-surat.js
import { supabase } from '../../lib/supabaseClient.js';
import { requireRole } from '../../lib/auth.js';
import { buildWaLink, templatePerluPerbaikan, templateSuratDibuatSekretaris } from '../../lib/whatsapp.js';
import { maskNIK } from '../../lib/format.js';

let suratAktif = null;   // null = mode TAMBAH surat baru; berisi objek = mode EDIT/VERIFIKASI
let daftarJenisSurat = [];
let modal;

export async function init() {
  const profile = await requireRole(['Sekretaris RT', 'Administrator']);
  if (!profile) return;

  modal = new bootstrap.Modal(document.getElementById('modalVerifikasi'));
  await muatJenisSurat();
  await muatAntrian();

  document.getElementById('btn-tambah-surat').addEventListener('click', bukaTambah);
  document.getElementById('btn-simpan-verifikasi').addEventListener('click', simpanDanTeruskan);
  document.getElementById('btn-simpan-baru').addEventListener('click', simpanSuratBaru);
  document.getElementById('btn-minta-perbaikan').addEventListener('click', mintaPerbaikan);
  document.getElementById('btn-hapus-surat').addEventListener('click', hapusSurat);
}

async function muatJenisSurat() {
  const { data, error } = await supabase.from('jenis_surat').select('id, nama_jenis').order('nama_jenis');
  if (error) { console.error(error.message); daftarJenisSurat = []; return; }
  daftarJenisSurat = data || [];
  document.getElementById('edit_jenis_surat').innerHTML =
    daftarJenisSurat.map(j => `<option value="${j.id}">${j.nama_jenis}</option>`).join('');
}

async function muatAntrian() {
  const wrap = document.getElementById('daftar-antrian');
  wrap.innerHTML = `<div class="text-muted small">Memuat antrian...</div>`;

  const { data, error } = await supabase
    .from('surat')
    .select('id, nomor_surat, nik_pemohon, nama_pemohon, no_hp_pemohon, isi_surat, status, created_at, jenis_surat_id, jenis_surat:jenis_surat_id (nama_jenis)')
    .eq('status', 'menunggu_verifikasi')
    .order('created_at', { ascending: true });

  if (error) { wrap.innerHTML = `<div class="alert alert-danger small">${error.message}</div>`; return; }
  if (!data.length) { wrap.innerHTML = `<div class="text-muted small text-center py-4">Tidak ada pengajuan menunggu verifikasi 🎉</div>`; return; }

  wrap.innerHTML = data.map(s => `
    <div class="card p-3" style="border-radius:var(--radius-card); border-color:var(--color-border);" data-id="${s.id}">
      <div class="d-flex justify-content-between">
        <div style="cursor:pointer;" class="js-buka-verifikasi flex-fill">
          <div class="fw-semibold">${s.nama_pemohon}</div>
          <div class="small text-muted">${s.jenis_surat?.nama_jenis || '-'} · NIK ${maskNIK(s.nik_pemohon)}</div>
        </div>
        <span class="badge" style="background:var(--color-secondary-container); color:#8a5a12; align-self:start;">Baru</span>
      </div>
      <a href="#/preview-surat?id=${s.id}" class="small mt-2 d-inline-block" style="color:var(--color-primary);">Lihat format surat →</a>
    </div>
  `).join('');

  wrap.querySelectorAll('.js-buka-verifikasi').forEach(el => {
    const id = el.closest('[data-id]').dataset.id;
    el.addEventListener('click', () => bukaVerifikasi(data.find(s => s.id === id)));
  });
}

/** Buka modal dalam mode TAMBAH surat baru (dibuat langsung oleh Sekretaris) */
function bukaTambah() {
  suratAktif = null;
  document.getElementById('modalVerifikasiTitle').textContent = 'Tambah Surat Baru';
  document.getElementById('wrap_jenis_surat').classList.remove('d-none');
  document.getElementById('wrap_catatan').classList.add('d-none');
  document.getElementById('edit_nik').value = '';
  document.getElementById('edit_nama').value = '';
  document.getElementById('edit_no_hp').value = '';
  document.getElementById('edit_isi').value = '';
  document.getElementById('edit_catatan').value = '';

  document.getElementById('btn-hapus-surat').classList.add('d-none');
  document.getElementById('btn-minta-perbaikan').classList.add('d-none');
  document.getElementById('btn-simpan-verifikasi').classList.add('d-none');
  document.getElementById('btn-simpan-baru').classList.remove('d-none');
  document.getElementById('btn-lihat-format').classList.add('d-none');
  modal.show();
}

/** Buka modal dalam mode EDIT/VERIFIKASI surat yang sudah masuk antrian */
function bukaVerifikasi(surat) {
  suratAktif = surat;
  document.getElementById('modalVerifikasiTitle').textContent = 'Verifikasi Pengajuan';
  document.getElementById('wrap_jenis_surat').classList.add('d-none');
  document.getElementById('wrap_catatan').classList.remove('d-none');
  document.getElementById('edit_nik').value = surat.nik_pemohon || '';
  document.getElementById('edit_nama').value = surat.nama_pemohon || '';
  document.getElementById('edit_no_hp').value = surat.no_hp_pemohon || '';
  document.getElementById('edit_isi').value = surat.isi_surat || '';
  document.getElementById('edit_catatan').value = '';

  document.getElementById('btn-hapus-surat').classList.remove('d-none');
  document.getElementById('btn-minta-perbaikan').classList.remove('d-none');
  document.getElementById('btn-simpan-verifikasi').classList.remove('d-none');
  document.getElementById('btn-simpan-baru').classList.add('d-none');

  const btnFormat = document.getElementById('btn-lihat-format');
  btnFormat.href = `#/preview-surat?id=${surat.id}`;
  btnFormat.classList.remove('d-none');
  modal.show();
}

function bacaFormUmum() {
  return {
    nik_pemohon: document.getElementById('edit_nik').value.trim(),
    nama_pemohon: document.getElementById('edit_nama').value.trim(),
    no_hp_pemohon: document.getElementById('edit_no_hp').value.trim(),
    isi_surat: document.getElementById('edit_isi').value.trim(),
  };
}

function validasiFormUmum(f) {
  if (!/^\d{16}$/.test(f.nik_pemohon)) { alert('NIK harus 16 digit angka.'); return false; }
  if (f.nama_pemohon.length < 3) { alert('Nama lengkap wajib diisi.'); return false; }
  if (!/^0\d{9,13}$/.test(f.no_hp_pemohon)) { alert('Nomor WhatsApp tidak valid (mulai dengan 0).'); return false; }
  return true;
}

/** TAMBAH: Sekretaris mencatat surat baru langsung (mis. pemohon datang tanpa lewat form publik) */
async function simpanSuratBaru() {
  const jenisSuratId = document.getElementById('edit_jenis_surat').value;
  if (!jenisSuratId) { alert('Pilih jenis surat terlebih dahulu.'); return; }
  const f = bacaFormUmum();
  if (!validasiFormUmum(f)) return;

  const btn = document.getElementById('btn-simpan-baru');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    const { error } = await supabase.from('surat').insert({
      jenis_surat_id: jenisSuratId,
      ...f,
      status: 'terverifikasi_sekretaris_rt', // dibuat & langsung diverifikasi Sekretaris, siap ke Ketua RT
      diajukan_tanpa_login: true,
    });
    if (error) throw error;

    modal.hide();
    await muatAntrian();

    // Notifikasi WA ke pemohon bahwa suratnya sudah dicatat
    const pesan = templateSuratDibuatSekretaris({
      namaPemohon: f.nama_pemohon,
      jenisSurat: daftarJenisSurat.find(j => j.id === jenisSuratId)?.nama_jenis || 'surat',
    });
    window.open(buildWaLink(f.no_hp_pemohon, pesan), '_blank');
  } catch (err) {
    alert('Gagal menyimpan surat baru: ' + err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Simpan Surat Baru';
  }
}

/** SIMPAN perubahan (edit) + teruskan ke Ketua RT */
async function simpanDanTeruskan() {
  const f = bacaFormUmum();
  if (!validasiFormUmum(f)) return;

  const payload = { ...f, status: 'terverifikasi_sekretaris_rt', catatan_perbaikan: null };
  const { error } = await supabase.from('surat').update(payload).eq('id', suratAktif.id);
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }

  modal.hide();
  await muatAntrian();
}

/** SIMPAN catatan perbaikan + kirim notifikasi WA (link wa.me, ditinjau manual) */
async function mintaPerbaikan() {
  const catatan = document.getElementById('edit_catatan').value.trim();
  if (!catatan) { alert('Isi catatan perbaikan terlebih dahulu.'); return; }

  const noHp = document.getElementById('edit_no_hp').value.trim();
  const { error } = await supabase.from('surat').update({
    status: 'perlu_perbaikan',
    catatan_perbaikan: catatan,
    no_hp_pemohon: noHp || suratAktif.no_hp_pemohon,
  }).eq('id', suratAktif.id);
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }

  modal.hide();
  await muatAntrian();

  // Notifikasi WA — buka SETELAH antrian dimuat ulang, hanya jika nomor tersedia.
  const nomorTujuan = noHp || suratAktif.no_hp_pemohon;
  if (!nomorTujuan) {
    alert('Catatan perbaikan sudah disimpan, tapi nomor WhatsApp pemohon tidak ditemukan — silakan hubungi pemohon secara manual.');
    return;
  }
  const pesan = templatePerluPerbaikan({
    namaPemohon: suratAktif.nama_pemohon,
    jenisSurat: suratAktif.jenis_surat?.nama_jenis || 'surat',
    catatan,
    linkPerbaikan: `${location.origin}/#/ajukan-surat`,
  });
  window.open(buildWaLink(nomorTujuan, pesan), '_blank');
}

/** HAPUS pengajuan surat (hanya untuk yang belum resmi/bernomor — dijaga RLS migrasi 017) */
async function hapusSurat() {
  if (!suratAktif) return;
  if (!confirm(`Hapus pengajuan surat atas nama "${suratAktif.nama_pemohon}"? Tindakan ini tidak bisa dibatalkan.`)) return;

  const btn = document.getElementById('btn-hapus-surat');
  btn.disabled = true; btn.textContent = 'Menghapus...';
  const { error } = await supabase.from('surat').delete().eq('id', suratAktif.id);
  btn.disabled = false; btn.textContent = 'Hapus';

  if (error) { alert('Gagal menghapus: ' + error.message); return; }
  modal.hide();
  await muatAntrian();
}
