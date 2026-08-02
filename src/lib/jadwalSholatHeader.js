// src/lib/jadwalSholatHeader.js
// Widget global "Jam & Waktu Sholat" — tampil di SEMUA halaman
// (login, beranda publik, maupun semua halaman berlogin apa pun
// role-nya), karena dipasang langsung di index.html (di luar
// #app-outlet yang isinya berganti-ganti per rute), diinisialisasi
// sekali dari app.js saat aplikasi pertama dimuat.
//
// Memakai perhitungan yang sama seperti halaman "Jadwal Sholat
// Sepanjang Masa" (lib adhan, koordinat langgar pertama) — lihat
// src/pages/beranda-publik/beranda-publik.js untuk versi lengkap
// dengan pemilihan tanggal & langgar.
import { PrayerTimes, CalculationMethod, Coordinates } from 'https://cdn.jsdelivr.net/npm/adhan@4.4.3/+esm';
import { supabase } from './supabaseClient.js';

const NAMA_WAKTU = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
let koordinatLanggar = null;
let jadwalHariIni = null;
let tanggalJadwalDihitung = null;

export async function initJadwalSholatHeader(elId) {
  const el = document.getElementById(elId);
  if (!el) return;

  el.innerHTML = `<span id="gjb-jam" class="mono"></span><span class="gjb-sep">·</span><span id="gjb-sholat"></span>`;

  await muatKoordinat();
  tick(el);
  setInterval(() => tick(el), 1000);
}

async function muatKoordinat() {
  // Cache di sessionStorage supaya tidak query ulang tiap pindah halaman
  // (modul JS dimuat ulang tiap navigasi di router.js).
  const cached = sessionStorage.getItem('silatrt-langgar-koordinat');
  if (cached) {
    koordinatLanggar = JSON.parse(cached);
    return;
  }
  const { data, error } = await supabase
    .from('langgar')
    .select('latitude, longitude')
    .not('latitude', 'is', null)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    koordinatLanggar = null;
    return;
  }
  koordinatLanggar = { latitude: Number(data.latitude), longitude: Number(data.longitude) };
  sessionStorage.setItem('silatrt-langgar-koordinat', JSON.stringify(koordinatLanggar));
}

function hitungJadwalHariIni() {
  const hariIni = new Date().toISOString().slice(0, 10);
  if (jadwalHariIni && tanggalJadwalDihitung === hariIni) return jadwalHariIni;

  if (!koordinatLanggar) { jadwalHariIni = null; return null; }

  const koordinat = new Coordinates(koordinatLanggar.latitude, koordinatLanggar.longitude);
  const params = CalculationMethod.MoonsightingCommittee();
  const pt = new PrayerTimes(koordinat, new Date(), params);

  jadwalHariIni = [pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha];
  tanggalJadwalDihitung = hariIni;
  return jadwalHariIni;
}

function tick(el) {
  const sekarang = new Date();
  document.getElementById('gjb-jam').textContent = sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

  const sholatEl = document.getElementById('gjb-sholat');
  const jadwal = hitungJadwalHariIni();
  if (!jadwal) {
    sholatEl.textContent = 'Jadwal sholat belum tersedia';
    return;
  }

  let idx = jadwal.findIndex(waktu => waktu > sekarang);
  if (idx === -1) idx = 0; // sudah lewat Isya -> tampilkan Subuh besok sebagai acuan berikutnya (estimasi jam sama)

  const target = jadwal[idx];
  const selisihMs = idx === 0 && target < sekarang
    ? (target.getTime() + 24 * 3600 * 1000) - sekarang.getTime()
    : target.getTime() - sekarang.getTime();
  const menitLagi = Math.max(0, Math.round(selisihMs / 60000));
  const jamLagi = Math.floor(menitLagi / 60);
  const sisaMenit = menitLagi % 60;
  const labelSisa = jamLagi > 0 ? `${jamLagi}j ${sisaMenit}m lagi` : `${sisaMenit}m lagi`;

  sholatEl.textContent = `${NAMA_WAKTU[idx]} ${target.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} (${labelSisa})`;
}
