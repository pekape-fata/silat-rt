// src/pages/surat/preview-surat.js
import { supabase } from '../../lib/supabaseClient.js';
import { requireRole } from '../../lib/auth.js';
import { cetakSuratPDF } from '../../lib/pdf.js';
import { formatTanggalIndo } from '../../lib/format.js';
import { buildWaLink, templateSuratTerbit } from '../../lib/whatsapp.js';

// Status yang masih boleh DIHAPUS oleh Sekretaris RT/Admin — harus sinkron
// dengan policy "surat_delete_sekretaris_rt" di migrasi 017 (surat yang
// sudah bernomor/ditandatangani tidak boleh dihapus, demi jejak audit).
const STATUS_BOLEH_HAPUS = ['draf_publik', 'menunggu_verifikasi', 'perlu_perbaikan', 'terverifikasi_sekretaris_rt'];

let surat = null;
let profileAktif = null;
let modeEdit = false;

export async function init(query) {
  const profile = await requireRole(['Sekretaris RT', 'Ketua RT', 'Ketua RW', 'Sekretaris RW', 'Administrator']);
  if (!profile) return;
  profileAktif = profile;

  const suratId = query.get('id');
  if (!suratId) { document.getElementById('preview-card').innerHTML = '<div class="alert alert-warning">ID surat tidak ditemukan.</div>'; return; }

  await muatSurat(suratId);

  document.getElementById('btn-edit').addEventListener('click', toggleEdit);
  document.getElementById('btn-unduh').addEventListener('click', () => cetak('unduh'));
  document.getElementById('btn-cetak').addEventListener('click', () => cetak('print'));
  document.getElementById('btn-kirim-wa').addEventListener('click', kirimWa);
  document.getElementById('btn-hapus').addEventListener('click', hapusSurat);
}

async function muatSurat(id) {
  const { data, error } = await supabase
    .from('surat')
    .select(`
      id, nomor_surat, nama_pemohon, nik_pemohon, no_hp_pemohon, isi_surat, status,
      terbit_at, atas_nama_pelimpahan_rt, atas_nama_pelimpahan_rw,
      jenis_surat:jenis_surat_id ( nama_jenis )
    `)
    .eq('id', id)
    .single();

  if (error) { document.getElementById('preview-card').innerHTML = `<div class="alert alert-danger">${error.message}</div>`; return; }
  surat = data;
  render();
  aturVisibilitasTombol();
}

function render() {
  const card = document.getElementById('preview-card');
  card.innerHTML = `
    <div class="small text-muted mb-1">${surat.jenis_surat?.nama_jenis || '-'}</div>
    <div class="fw-bold mb-2">${surat.nomor_surat || '(belum bernomor — terbit setelah TTD lengkap)'}</div>
    <div class="small text-muted mb-1">Atas Nama</div>
    <div class="mb-2">${surat.nama_pemohon}</div>
    <div class="small text-muted mb-1">Isi Surat</div>
    <div id="isi-tampil" class="mb-2" style="white-space:pre-line;">${surat.isi_surat || '-'}</div>
    <textarea id="isi-edit" class="form-control d-none" rows="5">${surat.isi_surat || ''}</textarea>
    <span class="badge" style="background:var(--color-primary-container); color:var(--color-primary);">${labelStatus(surat.status)}</span>
  `;
}

/** Tombol Kirim WA & Hapus hanya muncul kalau relevan dengan status/role saat ini */
function aturVisibilitasTombol() {
  const btnKirim = document.getElementById('btn-kirim-wa');
  const bisaKirim = surat.status === 'terbit' && !!surat.no_hp_pemohon;
  btnKirim.classList.toggle('d-none', !bisaKirim);
  if (surat.status === 'terbit' && !surat.no_hp_pemohon) {
    btnKirim.title = 'Nomor WhatsApp pemohon tidak tersedia untuk surat ini.';
  }

  const btnHapus = document.getElementById('btn-hapus');
  const perananBolehHapus = ['Sekretaris RT', 'Administrator'].includes(profileAktif.role);
  const statusBolehHapus = STATUS_BOLEH_HAPUS.includes(surat.status) && !surat.nomor_surat;
  btnHapus.classList.toggle('d-none', !(perananBolehHapus && statusBolehHapus));
}

function toggleEdit() {
  modeEdit = !modeEdit;
  document.getElementById('isi-tampil').classList.toggle('d-none', modeEdit);
  document.getElementById('isi-edit').classList.toggle('d-none', !modeEdit);
  document.getElementById('btn-edit').textContent = modeEdit ? 'Simpan Perubahan' : 'Edit';

  if (!modeEdit) simpanEdit(); // saat tombol ditekan lagi (keluar mode edit) -> SIMPAN ke database
}

/** SIMPAN hasil edit ke Supabase */
async function simpanEdit() {
  const isiBaru = document.getElementById('isi-edit').value.trim();
  const { error } = await supabase.from('surat').update({ isi_surat: isiBaru }).eq('id', surat.id);
  if (error) { alert('Gagal menyimpan perubahan: ' + error.message); return; }
  surat.isi_surat = isiBaru;
  render();
}

/** CETAK/UNDUH ke PDF — mode 'unduh' langsung menyimpan file, mode 'print' membuka dialog cetak browser */
async function cetak(mode) {
  const btnId = mode === 'print' ? 'btn-cetak' : 'btn-unduh';
  const btn = document.getElementById(btnId);
  const labelAsli = btn ? btn.textContent : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Menyiapkan...'; }
  try {
    await cetakSuratPDF({
      ...surat,
      jenis_surat_nama: surat.jenis_surat?.nama_jenis,
      tanggal_terbit_format: surat.terbit_at ? formatTanggalIndo(surat.terbit_at) : formatTanggalIndo(new Date()),
      nama_penandatangan_rt: 'Ketua RT 01',
      nama_penandatangan_rw: 'Ketua RW 09',
    }, { mode });
  } catch (err) {
    alert('Gagal memproses PDF: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = labelAsli; }
  }
}

/** KIRIM notifikasi WA ke pemohon bahwa surat sudah terbit (link wa.me, ditinjau manual sebelum kirim) */
function kirimWa() {
  if (!surat.no_hp_pemohon) { alert('Nomor WhatsApp pemohon tidak tersedia.'); return; }
  const pesan = templateSuratTerbit({
    namaPemohon: surat.nama_pemohon,
    jenisSurat: surat.jenis_surat?.nama_jenis || 'surat',
    nomorSurat: surat.nomor_surat || '-',
    linkUnduh: `${location.origin}/#/beranda-publik`,
  });
  window.open(buildWaLink(surat.no_hp_pemohon, pesan), '_blank');
}

/** HAPUS surat (hanya untuk yang belum resmi/bernomor — dijaga RLS migrasi 017) */
async function hapusSurat() {
  if (!confirm(`Hapus pengajuan surat atas nama "${surat.nama_pemohon}"? Tindakan ini tidak bisa dibatalkan.`)) return;

  const btn = document.getElementById('btn-hapus');
  btn.disabled = true; btn.textContent = 'Menghapus...';
  const { error } = await supabase.from('surat').delete().eq('id', surat.id);
  if (error) { alert('Gagal menghapus: ' + error.message); btn.disabled = false; btn.textContent = 'Hapus'; return; }

  alert('Surat berhasil dihapus.');
  location.hash = '#/antrian-surat';
}

function labelStatus(status) {
  const map = {
    draf_publik: 'Draf',
    menunggu_verifikasi: 'Menunggu Verifikasi',
    perlu_perbaikan: 'Perlu Perbaikan',
    terverifikasi_sekretaris_rt: 'Terverifikasi Sekretaris RT',
    ditandatangani_rt: 'Ditandatangani Ketua RT',
    diteruskan_rw: 'Diteruskan ke RW',
    ditandatangani_rw: 'Ditandatangani Ketua RW',
    terbit: 'Terbit',
    ditolak: 'Ditolak',
  };
  return map[status] || status;
}
