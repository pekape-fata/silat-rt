// src/pages/surat/preview-surat.js
import { supabase } from '../../lib/supabaseClient.js';
import { requireRole } from '../../lib/auth.js';
import { cetakSuratPDF } from '../../lib/pdf.js';
import { formatTanggalIndo } from '../../lib/format.js';

let surat = null;
let modeEdit = false;

export async function init(query) {
  const profile = await requireRole(['Sekretaris RT', 'Ketua RT', 'Ketua RW', 'Sekretaris RW', 'Administrator']);
  if (!profile) return;

  const suratId = query.get('id');
  if (!suratId) { document.getElementById('preview-card').innerHTML = '<div class="alert alert-warning">ID surat tidak ditemukan.</div>'; return; }

  await muatSurat(suratId);

  document.getElementById('btn-edit').addEventListener('click', toggleEdit);
  document.getElementById('btn-cetak').addEventListener('click', cetak);
}

async function muatSurat(id) {
  const { data, error } = await supabase
    .from('surat')
    .select(`
      id, nomor_surat, nama_pemohon, nik_pemohon, isi_surat, status,
      terbit_at, atas_nama_pelimpahan_rt, atas_nama_pelimpahan_rw,
      jenis_surat:jenis_surat_id ( nama_jenis )
    `)
    .eq('id', id)
    .single();

  if (error) { document.getElementById('preview-card').innerHTML = `<div class="alert alert-danger">${error.message}</div>`; return; }
  surat = data;
  render();
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

/** CETAK ke PDF (unduh langsung ke perangkat) */
function cetak() {
  cetakSuratPDF({
    ...surat,
    jenis_surat_nama: surat.jenis_surat?.nama_jenis,
    tanggal_terbit_format: surat.terbit_at ? formatTanggalIndo(surat.terbit_at) : formatTanggalIndo(new Date()),
    nama_penandatangan_rt: 'Ketua RT 01',
    nama_penandatangan_rw: 'Ketua RW 09',
  });
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
