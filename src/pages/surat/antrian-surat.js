// src/pages/surat/antrian-surat.js
import { supabase } from '../../lib/supabaseClient.js';
import { requireRole } from '../../lib/auth.js';
import { buildWaLink, templatePerluPerbaikan } from '../../lib/whatsapp.js';
import { maskNIK } from '../../lib/format.js';

let suratAktif = null;
let modal;

export async function init() {
  const profile = await requireRole(['Sekretaris RT', 'Administrator']);
  if (!profile) return;

  modal = new bootstrap.Modal(document.getElementById('modalVerifikasi'));
  await muatAntrian();

  document.getElementById('btn-simpan-verifikasi').addEventListener('click', simpanDanTeruskan);
  document.getElementById('btn-minta-perbaikan').addEventListener('click', mintaPerbaikan);
}

async function muatAntrian() {
  const wrap = document.getElementById('daftar-antrian');
  wrap.innerHTML = `<div class="text-muted small">Memuat antrian...</div>`;

  const { data, error } = await supabase
    .from('surat')
    .select('id, nomor_surat, nik_pemohon, nama_pemohon, isi_surat, status, created_at, jenis_surat:jenis_surat_id (nama_jenis)')
    .eq('status', 'menunggu_verifikasi')
    .order('created_at', { ascending: true });

  if (error) { wrap.innerHTML = `<div class="alert alert-danger small">${error.message}</div>`; return; }
  if (!data.length) { wrap.innerHTML = `<div class="text-muted small text-center py-4">Tidak ada pengajuan menunggu verifikasi 🎉</div>`; return; }

  wrap.innerHTML = data.map(s => `
    <div class="card p-3" style="border-radius:var(--radius-card); border-color:var(--color-border); cursor:pointer;" data-id="${s.id}">
      <div class="d-flex justify-content-between">
        <div>
          <div class="fw-semibold">${s.nama_pemohon}</div>
          <div class="small text-muted">${s.jenis_surat?.nama_jenis || '-'} · NIK ${maskNIK(s.nik_pemohon)}</div>
        </div>
        <span class="badge" style="background:var(--color-secondary-container); color:#8a5a12; align-self:start;">Baru</span>
      </div>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-id]').forEach(card => {
    card.addEventListener('click', () => bukaVerifikasi(data.find(s => s.id === card.dataset.id)));
  });
}

function bukaVerifikasi(surat) {
  suratAktif = surat;
  document.getElementById('edit_nik').value = surat.nik_pemohon || '';
  document.getElementById('edit_nama').value = surat.nama_pemohon || '';
  document.getElementById('edit_isi').value = surat.isi_surat || '';
  document.getElementById('edit_catatan').value = '';
  modal.show();
}

/** SIMPAN perubahan (edit) + teruskan ke Ketua RT */
async function simpanDanTeruskan() {
  const payload = {
    nik_pemohon: document.getElementById('edit_nik').value.trim(),
    nama_pemohon: document.getElementById('edit_nama').value.trim(),
    isi_surat: document.getElementById('edit_isi').value.trim(),
    status: 'terverifikasi_sekretaris_rt',
    catatan_perbaikan: null,
  };
  const { error } = await supabase.from('surat').update(payload).eq('id', suratAktif.id);
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }

  modal.hide();
  await muatAntrian();
}

/** SIMPAN catatan perbaikan + kirim notifikasi WA (link wa.me, ditinjau manual) */
async function mintaPerbaikan() {
  const catatan = document.getElementById('edit_catatan').value.trim();
  if (!catatan) { alert('Isi catatan perbaikan terlebih dahulu.'); return; }

  const { error } = await supabase.from('surat').update({
    status: 'perlu_perbaikan',
    catatan_perbaikan: catatan,
  }).eq('id', suratAktif.id);
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }

  // Buka WhatsApp dengan draf pesan — admin meninjau sebelum kirim (sesuai requirement: tanpa API berbayar)
  const pesan = templatePerluPerbaikan({
    namaPemohon: suratAktif.nama_pemohon,
    jenisSurat: suratAktif.jenis_surat?.nama_jenis || 'surat',
    catatan,
    linkPerbaikan: `${location.origin}/#/ajukan-surat`,
  });
  window.open(buildWaLink(suratAktif.no_hp_pemohon, pesan), '_blank');

  modal.hide();
  await muatAntrian();
}
