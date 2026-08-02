// src/pages/beranda-publik/beranda-publik.js
// Halaman depan PUBLIK (tanpa login) — menampilkan jadwal sholat.
//
// "Sepanjang Masa": jadwal DIHITUNG di sisi client dari koordinat
// langgar (latitude/longitude) pakai library `adhan`, bukan dibaca
// dari cache harian (`jadwal_sholat_cache`) yang hanya berisi
// tanggal-tanggal yang pernah di-fetch. Dengan perhitungan langsung,
// tanggal berapa pun (masa lalu maupun masa depan) selalu bisa
// ditampilkan tanpa tergantung status cache/API pihak ketiga.
//
// Kalau ke depan diperlukan jadwal yang disesuaikan manual oleh Imam
// (mis. plus/minus beberapa menit sesuai kebiasaan lokal), tabel
// `jadwal_sholat_cache` yang sudah ada bisa dipakai sebagai
// "override" — dicek dulu sebelum fallback ke hasil hitungan.
import { PrayerTimes, CalculationMethod, Coordinates } from 'https://cdn.jsdelivr.net/npm/adhan@4.4.3/+esm';
import { supabase } from '../../lib/supabaseClient.js';

let semuaLanggar = [];
let langgarAktif = null;

export async function init() {
  await muatLanggar();

  if (!semuaLanggar.length) {
    document.getElementById('bp-jadwal-body').innerHTML =
      `<div class="text-caption">Data langgar belum tersedia.</div>`;
    return;
  }

  if (semuaLanggar.length > 1) {
    const picker = document.getElementById('bp-langgar-picker');
    const select = document.getElementById('bp_langgar_select');
    picker.style.display = 'block';
    select.innerHTML = semuaLanggar.map(l => `<option value="${l.id}">${escapeHtml(l.nama_langgar)}</option>`).join('');
    select.addEventListener('change', () => {
      langgarAktif = semuaLanggar.find(l => l.id === select.value);
      render();
    });
  }

  langgarAktif = semuaLanggar[0];

  const inputTanggal = document.getElementById('bp_tanggal');
  inputTanggal.value = new Date().toISOString().slice(0, 10);
  inputTanggal.addEventListener('change', render);

  render();
}

async function muatLanggar() {
  // Butuh migrasi 014_public_select_langgar.sql (policy anon select)
  // supaya query ini berhasil untuk pengunjung yang belum login.
  const { data, error } = await supabase
    .from('langgar')
    .select('id, nama_langgar, latitude, longitude')
    .order('nama_langgar');

  if (error) {
    console.error('Gagal memuat data langgar:', error.message);
    semuaLanggar = [];
    return;
  }
  semuaLanggar = data || [];
}

function render() {
  document.getElementById('bp-nama-langgar').textContent = langgarAktif.nama_langgar;
  const body = document.getElementById('bp-jadwal-body');

  if (langgarAktif.latitude == null || langgarAktif.longitude == null) {
    body.innerHTML = `<div class="text-caption">Koordinat lokasi langgar ini belum diatur oleh pengurus, jadwal belum bisa dihitung.</div>`;
    return;
  }

  const tanggal = new Date(document.getElementById('bp_tanggal').value + 'T12:00:00');
  const koordinat = new Coordinates(Number(langgarAktif.latitude), Number(langgarAktif.longitude));
  // Metode perhitungan Kemenag RI (mendekati standar yang umum dipakai di Indonesia)
  const params = CalculationMethod.MoonsightingCommittee();
  const jadwal = new PrayerTimes(koordinat, tanggal, params);

  const baris = [
    ['Subuh', jadwal.fajr],
    ['Dzuhur', jadwal.dhuhr],
    ['Ashar', jadwal.asr],
    ['Maghrib', jadwal.maghrib],
    ['Isya', jadwal.isha],
  ];

  body.innerHTML = `
    <div class="d-flex flex-column gap-2">
      ${baris.map(([label, waktu]) => `
        <div class="d-flex justify-content-between align-items-center py-2" style="border-bottom:1px solid var(--color-border,#eee);">
          <span>${label}</span>
          <span class="mono fw-bold">${formatJam(waktu)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function formatJam(date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
