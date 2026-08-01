// src/pages/surat/ajukan-surat-publik.js
// Halaman PUBLIK — insert langsung ke tabel `surat` sebagai role anon
// (diizinkan oleh policy "surat_public_insert", revisi 05e).
import { supabase } from '../../lib/supabaseClient.js';

export async function init() {
  const form = document.getElementById('form-ajukan-surat');
  const jenisSelect = document.getElementById('jenis_surat_id');
  const alertBox = document.getElementById('alert-box');
  const btnSimpan = document.getElementById('btn-simpan');

  await muatJenisSurat(jenisSelect);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    sembunyikanAlert();
    btnSimpan.disabled = true;
    btnSimpan.textContent = 'Menyimpan...';

    try {
      const payload = {
        jenis_surat_id: jenisSelect.value,
        nik_pemohon: document.getElementById('nik_pemohon').value.trim(),
        nama_pemohon: document.getElementById('nama_pemohon').value.trim(),
        no_hp_pemohon: document.getElementById('no_hp_pemohon').value.trim(),
        isi_surat: document.getElementById('keperluan').value.trim(), // draf awal, akan disusun ulang oleh Sekretaris RT dari template
        status: 'draf_publik',
        diajukan_tanpa_login: true,
      };

      validasi(payload);

      // 1. SIMPAN pengajuan
      const { data, error } = await supabase.from('surat').insert(payload).select('id').single();
      if (error) throw error;

      // 2. Update status jadi "menunggu_verifikasi" agar langsung masuk antrian Sekretaris RT
      await supabase.from('surat').update({ status: 'menunggu_verifikasi' }).eq('id', data.id);

      tampilkanSukses(data.id);
      form.reset();
    } catch (err) {
      tampilkanError(err.message || 'Terjadi kesalahan, silakan coba lagi.');
    } finally {
      btnSimpan.disabled = false;
      btnSimpan.textContent = 'Simpan & Ajukan';
    }
  });

  function validasi(p) {
    if (!/^\d{16}$/.test(p.nik_pemohon)) throw new Error('NIK harus 16 digit angka.');
    if (p.nama_pemohon.length < 3) throw new Error('Nama lengkap wajib diisi.');
    if (!/^0\d{9,13}$/.test(p.no_hp_pemohon)) throw new Error('Nomor WhatsApp tidak valid (mulai dengan 0).');
  }

  function tampilkanSukses(idPengajuan) {
    alertBox.className = 'alert alert-success small';
    alertBox.innerHTML = `Pengajuan berhasil disimpan (ID: <span class="mono">${idPengajuan.slice(0, 8)}</span>). Anda akan dihubungi via WhatsApp setelah diverifikasi Sekretaris RT.`;
    alertBox.classList.remove('d-none');
  }
  function tampilkanError(msg) {
    alertBox.className = 'alert alert-danger small';
    alertBox.textContent = msg;
    alertBox.classList.remove('d-none');
  }
  function sembunyikanAlert() { alertBox.classList.add('d-none'); }
}

async function muatJenisSurat(select) {
  const { data, error } = await supabase.from('jenis_surat').select('id, nama_jenis').order('nama_jenis');
  if (error) { console.error(error); return; }
  select.innerHTML = '<option value="" disabled selected>Pilih jenis surat...</option>' +
    data.map(j => `<option value="${j.id}">${j.nama_jenis}</option>`).join('');
}
