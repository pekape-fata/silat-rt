// src/pages/surat/ajukan-surat-publik.js
// Halaman PUBLIK — mengajukan surat lewat RPC "ajukan_surat_publik"
// (bukan insert+update langsung ke tabel, lihat migrasi 015 untuk
// alasannya — insert+update terpisah memicu error RLS pada langkah
// update karena tidak ada policy UPDATE yang mengizinkan anon).
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
      const nik = document.getElementById('nik_pemohon').value.trim();
      const nama = document.getElementById('nama_pemohon').value.trim();
      const noHp = document.getElementById('no_hp_pemohon').value.trim();
      const keperluan = document.getElementById('keperluan').value.trim();

      validasi({ nik, nama, noHp });

      const { data: idPengajuan, error } = await supabase.rpc('ajukan_surat_publik', {
        p_jenis_surat_id: jenisSelect.value,
        p_nik_pemohon: nik,
        p_nama_pemohon: nama,
        p_no_hp_pemohon: noHp,
        p_isi_surat: keperluan,
      });

      if (error) throw error;

      tampilkanSukses(idPengajuan);
      form.reset();
    } catch (err) {
      tampilkanError(err.message || 'Terjadi kesalahan, silakan coba lagi.');
    } finally {
      btnSimpan.disabled = false;
      btnSimpan.textContent = 'Simpan & Ajukan';
    }
  });

  function validasi({ nik, nama, noHp }) {
    if (!/^\d{16}$/.test(nik)) throw new Error('NIK harus 16 digit angka.');
    if (nama.length < 3) throw new Error('Nama lengkap wajib diisi.');
    if (!/^0\d{9,13}$/.test(noHp)) throw new Error('Nomor WhatsApp tidak valid (mulai dengan 0).');
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
