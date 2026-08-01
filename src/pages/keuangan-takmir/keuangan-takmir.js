// src/pages/keuangan-takmir/keuangan-takmir.js
import { supabase } from '../../lib/supabaseClient.js';
import { requireRole } from '../../lib/auth.js';
import { formatRupiah, formatTanggalIndo } from '../../lib/format.js';

const ALLOWED = ['Bendahara Takmir', 'Ketua Takmir', 'Sekretaris Takmir', 'Administrator'];
let profileAktif = null;
let langgarAktif = null; // { id, nama_langgar } — langgar tempat bendahara bertugas
let modal = null;
let semuaTransaksi = [];
let kategoriList = [];

export async function init(queryParams) {
  const profile = await requireRole(ALLOWED);
  if (!profile) return;
  profileAktif = profile;

  await muatLanggarAktif();
  const bisaCatat = ['Bendahara Takmir', 'Administrator'].includes(profile.role) && langgarAktif;

  await muatKategori();
  await muatSemuaTransaksi();

  document.getElementById('kt-langgar-nama').textContent = langgarAktif ? langgarAktif.nama_langgar : '';

  renderHero();
  renderChart();
  renderKomposisi();
  renderFilterKategori();
  renderRiwayat();
  setupTabs();

  if (bisaCatat) {
    document.getElementById('kt-fab').style.display = 'flex';
    modal = new bootstrap.Modal(document.getElementById('modalCatatTransaksiTakmir'));
    document.getElementById('kt_tanggal').value = new Date().toISOString().slice(0, 10);
    document.getElementById('kt-fab').addEventListener('click', () => modal.show());
    document.getElementById('kt-btn-simpan').addEventListener('click', simpanTransaksi);
    if (queryParams?.get('aksi') === 'catat') modal.show();
  }
}

async function muatLanggarAktif() {
  // Bendahara/Ketua/Sekretaris Takmir bertugas di satu (atau lebih) langgar aktif — ambil yang pertama.
  const { data, error } = await supabase
    .from('pengurus_takmir')
    .select('langgar_id, langgar:langgar_id (id, nama_langgar)')
    .eq('user_id', profileAktif.id)
    .is('tanggal_selesai', null)
    .limit(1)
    .maybeSingle();
  if (error || !data) { langgarAktif = null; return; }
  langgarAktif = { id: data.langgar_id, nama_langgar: data.langgar?.nama_langgar || 'Langgar' };
}

async function muatKategori() {
  const { data, error } = await supabase.from('kategori_kas_takmir').select('id, nama_kategori').order('nama_kategori');
  if (error) { console.error(error.message); return; }
  kategoriList = data || [];
  const sel = document.getElementById('kt_kategori');
  if (sel) sel.innerHTML = kategoriList.map(k => `<option value="${k.id}">${k.nama_kategori}</option>`).join('');
}

async function muatSemuaTransaksi() {
  const { data, error } = await supabase
    .from('transaksi_keuangan_takmir')
    .select('id, tipe, nominal, keterangan, tanggal_transaksi, kategori_id, kategori:kategori_id (nama_kategori)')
    .order('tanggal_transaksi', { ascending: false });
  if (error) { console.error(error.message); semuaTransaksi = []; return; }
  semuaTransaksi = data || [];
}

function totals(rows) {
  let masuk = 0, keluar = 0;
  rows.forEach(r => { if (r.tipe === 'pemasukan') masuk += Number(r.nominal); else keluar += Number(r.nominal); });
  return { masuk, keluar, saldo: masuk - keluar };
}

function renderHero() {
  const { masuk, keluar, saldo } = totals(semuaTransaksi);
  document.getElementById('kt-saldo').textContent = formatRupiah(saldo);
  document.getElementById('kt-masuk').textContent = formatRupiah(masuk);
  document.getElementById('kt-keluar').textContent = formatRupiah(keluar);
  document.getElementById('kt-tahun').textContent = String(new Date().getFullYear());
}

function renderChart() {
  const bulanLabel = [];
  const perBulan = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    bulanLabel.push({ key, label: d.toLocaleDateString('id-ID', { month: 'short' }) });
    perBulan[key] = { masuk: 0, keluar: 0 };
  }
  semuaTransaksi.forEach(r => {
    const d = new Date(r.tanggal_transaksi);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!perBulan[key]) return;
    if (r.tipe === 'pemasukan') perBulan[key].masuk += Number(r.nominal); else perBulan[key].keluar += Number(r.nominal);
  });
  const max = Math.max(1, ...bulanLabel.map(b => Math.max(perBulan[b.key].masuk, perBulan[b.key].keluar)));
  const w = 320, h = 100, groupW = w / bulanLabel.length, barW = 12;
  let bars = '';
  bulanLabel.forEach((b, i) => {
    const cx = i * groupW + groupW / 2;
    const hm = (perBulan[b.key].masuk / max) * 70;
    const hk = (perBulan[b.key].keluar / max) * 70;
    bars += `<rect x="${cx - barW - 2}" y="${80 - hm}" width="${barW}" height="${Math.max(hm, 1)}" rx="3" fill="var(--color-success)"/>`;
    bars += `<rect x="${cx + 2}" y="${80 - hk}" width="${barW}" height="${Math.max(hk, 1)}" rx="3" fill="var(--color-danger)"/>`;
    bars += `<text x="${cx}" y="94" text-anchor="middle" class="bar-label">${b.label}</text>`;
  });
  document.getElementById('kt-chart').innerHTML = `<svg class="mini-bar-chart" viewBox="0 0 ${w} ${h}">${bars}</svg>`;
}

function renderKomposisi() {
  const awalBulan = new Date(); awalBulan.setDate(1);
  const bulanIni = semuaTransaksi.filter(r => r.tipe === 'pengeluaran' && new Date(r.tanggal_transaksi) >= awalBulan);
  const perKategori = {};
  bulanIni.forEach(r => {
    const nama = r.kategori?.nama_kategori || 'Lainnya';
    perKategori[nama] = (perKategori[nama] || 0) + Number(r.nominal);
  });
  const entries = Object.entries(perKategori).sort((a, b) => b[1] - a[1]);
  const wrap = document.getElementById('kt-komposisi');
  if (!entries.length) { wrap.innerHTML = `<div class="text-caption">Belum ada pengeluaran bulan ini.</div>`; return; }
  const max = Math.max(...entries.map(e => e[1]));
  wrap.innerHTML = entries.map(([nama, nominal]) => `
    <div class="mb-2">
      <div class="d-flex justify-content-between" style="font-size:13px;">
        <span>${nama}</span><span class="mono fw-semibold">${formatRupiah(nominal)}</span>
      </div>
      <div style="height:6px;border-radius:999px;background:var(--color-border);overflow:hidden;">
        <div style="height:100%;width:${(nominal / max) * 100}%;background:var(--color-secondary);"></div>
      </div>
    </div>
  `).join('');
}

function renderFilterKategori() {
  const wrap = document.getElementById('kt-filter-kategori');
  const chips = [{ id: '', label: 'Semua' }, ...kategoriList.map(k => ({ id: k.id, label: k.nama_kategori }))];
  wrap.innerHTML = chips.map((c, i) => `<div class="chip${i === 0 ? ' active' : ''}" data-kat="${c.id}">${c.label}</div>`).join('');
  wrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderRiwayat(chip.dataset.kat);
    });
  });
}

function renderRiwayat(filterKategoriId = '') {
  const rows = filterKategoriId ? semuaTransaksi.filter(r => r.kategori_id === filterKategoriId) : semuaTransaksi;
  const wrap = document.getElementById('kt-riwayat-list');
  if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><div class="empty-state__title">Belum ada transaksi</div></div>`; return; }
  wrap.innerHTML = `<div class="card" style="padding:4px 16px;">` + rows.slice(0, 50).map(r => `
    <div class="list-item d-flex align-items-center gap-2 py-2" style="border-bottom:1px solid var(--color-border);">
      <div style="font-size:18px;">🧾</div>
      <div class="flex-fill" style="min-width:0;">
        <div class="fw-semibold text-truncate" style="font-size:14px;">${r.kategori?.nama_kategori || r.keterangan || 'Transaksi'}</div>
        <div class="text-caption">${formatTanggalIndo(r.tanggal_transaksi)}</div>
      </div>
      <div class="mono fw-semibold" style="color:${r.tipe === 'pemasukan' ? 'var(--color-success)' : 'var(--color-danger)'};">
        ${r.tipe === 'pemasukan' ? '+' : '−'}${formatRupiah(r.nominal)}
      </div>
    </div>
  `).join('') + `</div>`;
}

function setupTabs() {
  document.querySelectorAll('#kt-tabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#kt-tabs .tab-item').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.kt-panel').forEach(p => { p.style.display = p.dataset.panel === tab.dataset.tab ? 'block' : 'none'; });
    });
  });
}

async function simpanTransaksi() {
  if (!langgarAktif) { alert('Akun ini tidak terdaftar sebagai pengurus takmir aktif di langgar manapun.'); return; }

  const tipe = document.getElementById('kt_tipe').value;
  const kategoriId = document.getElementById('kt_kategori').value || null;
  const nominal = Number(document.getElementById('kt_nominal').value);
  const tanggal = document.getElementById('kt_tanggal').value;
  const keterangan = document.getElementById('kt_keterangan').value.trim();

  if (!nominal || nominal <= 0) { alert('Nominal harus lebih dari 0.'); return; }
  if (!tanggal) { alert('Tanggal wajib diisi.'); return; }

  let buktiUrl = null;
  const fileInput = document.getElementById('kt_bukti');
  const status = document.getElementById('kt_bukti_status');
  if (fileInput.files?.[0]) {
    const file = fileInput.files[0];
    const path = `takmir/${langgarAktif.id}/${Date.now()}-${file.name}`;
    status.textContent = 'Mengunggah bukti...';
    const { error: uploadErr } = await supabase.storage.from('bukti-transaksi').upload(path, file);
    if (uploadErr) { status.textContent = `Gagal unggah bukti: ${uploadErr.message}`; }
    else { buktiUrl = path; status.textContent = 'Bukti berhasil diunggah.'; }
  }

  const payload = {
    langgar_id: langgarAktif.id,
    kategori_id: kategoriId,
    tipe,
    nominal,
    keterangan: keterangan || null,
    tanggal_transaksi: tanggal,
    dicatat_oleh: profileAktif.id,
    bukti_url: buktiUrl,
  };

  const { error } = await supabase.from('transaksi_keuangan_takmir').insert(payload);
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }

  modal.hide();
  document.getElementById('kt_nominal').value = '';
  document.getElementById('kt_keterangan').value = '';
  fileInput.value = '';
  status.textContent = '';

  await muatSemuaTransaksi();
  renderHero(); renderChart(); renderKomposisi(); renderRiwayat();
}
