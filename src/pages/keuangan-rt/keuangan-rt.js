// src/pages/keuangan-rt/keuangan-rt.js
import { supabase } from '../../lib/supabaseClient.js';
import { requireRole } from '../../lib/auth.js';
import { formatRupiah, formatTanggalIndo } from '../../lib/format.js';

const ALLOWED = ['Bendahara RT', 'Ketua RT', 'Sekretaris RT', 'Administrator'];
let profileAktif = null;
let modal = null;
let semuaTransaksi = [];
let jenisIuranList = [];

export async function init(queryParams) {
  const profile = await requireRole(ALLOWED);
  if (!profile) return;
  profileAktif = profile;

  const bisaCatat = ['Bendahara RT', 'Administrator'].includes(profile.role);

  await muatJenisIuran();
  await muatSemuaTransaksi();

  renderHero();
  renderChart();
  renderKomposisi();
  renderIuranWarga();
  renderArisanWarga();
  renderFilterJenis();
  renderRiwayat();

  setupTabs();

  if (bisaCatat) {
    document.getElementById('kr-fab').style.display = 'flex';
    modal = new bootstrap.Modal(document.getElementById('modalCatatTransaksiRT'));
    document.getElementById('kr_tanggal').value = new Date().toISOString().slice(0, 10);
    await muatDaftarKK();
    document.getElementById('kr-fab').addEventListener('click', () => modal.show());
    document.getElementById('kr-btn-simpan').addEventListener('click', simpanTransaksi);

    if (queryParams?.get('aksi') === 'catat') modal.show();
  }
  if (queryParams?.get('tab') === 'laporan') aktifkanTab('ringkasan');

  document.getElementById('kr_tipe')?.addEventListener('change', (e) => {
    document.getElementById('kr_wrap_jenis').style.display = e.target.value === 'pemasukan' ? 'block' : 'none';
  });
}

async function muatJenisIuran() {
  const { data, error } = await supabase.from('jenis_iuran').select('id, nama_iuran, periode').order('nama_iuran');
  if (error) { console.error(error.message); return; }
  jenisIuranList = data || [];
  const sel = document.getElementById('kr_jenis_iuran');
  if (sel) sel.innerHTML = jenisIuranList.map(j => `<option value="${j.id}">${j.nama_iuran}</option>`).join('');
}

async function muatDaftarKK() {
  const { data, error } = await supabase.from('kartu_keluarga').select('id, no_kk, alamat').order('no_kk');
  if (error) { console.error(error.message); return; }
  const sel = document.getElementById('kr_kk');
  (data || []).forEach(kk => {
    sel.insertAdjacentHTML('beforeend', `<option value="${kk.id}">${kk.no_kk} — ${kk.alamat}</option>`);
  });
}

async function muatSemuaTransaksi() {
  const { data, error } = await supabase
    .from('transaksi_keuangan_rt')
    .select('id, tipe, nominal, keterangan, tanggal_transaksi, kk_id, jenis_iuran_id, jenis_iuran:jenis_iuran_id (nama_iuran), kartu_keluarga:kk_id (no_kk)')
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
  document.getElementById('kr-saldo').textContent = formatRupiah(saldo);
  document.getElementById('kr-masuk').textContent = formatRupiah(masuk);
  document.getElementById('kr-keluar').textContent = formatRupiah(keluar);
  document.getElementById('kr-tahun').textContent = String(new Date().getFullYear());
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
  document.getElementById('kr-chart').innerHTML = `<svg class="mini-bar-chart" viewBox="0 0 ${w} ${h}">${bars}</svg>`;
}

function renderKomposisi() {
  const awalBulan = new Date(); awalBulan.setDate(1);
  const bulanIni = semuaTransaksi.filter(r => r.tipe === 'pemasukan' && new Date(r.tanggal_transaksi) >= awalBulan);
  const perJenis = {};
  bulanIni.forEach(r => {
    const nama = r.jenis_iuran?.nama_iuran || 'Lainnya';
    perJenis[nama] = (perJenis[nama] || 0) + Number(r.nominal);
  });
  const entries = Object.entries(perJenis).sort((a, b) => b[1] - a[1]);
  const wrap = document.getElementById('kr-komposisi');
  if (!entries.length) { wrap.innerHTML = `<div class="text-caption">Belum ada pemasukan bulan ini.</div>`; return; }
  const max = Math.max(...entries.map(e => e[1]));
  wrap.innerHTML = entries.map(([nama, nominal]) => `
    <div class="mb-2">
      <div class="d-flex justify-content-between" style="font-size:13px;">
        <span>${nama}</span><span class="mono fw-semibold">${formatRupiah(nominal)}</span>
      </div>
      <div style="height:6px;border-radius:999px;background:var(--color-border);overflow:hidden;">
        <div style="height:100%;width:${(nominal / max) * 100}%;background:var(--color-primary);"></div>
      </div>
    </div>
  `).join('');
}

function bulanIniRows(namaIuran) {
  const awalBulan = new Date(); awalBulan.setDate(1);
  return semuaTransaksi.filter(r =>
    r.tipe === 'pemasukan' &&
    (r.jenis_iuran?.nama_iuran || '') === namaIuran &&
    new Date(r.tanggal_transaksi) >= awalBulan
  );
}

function renderListSetoran(containerId, namaIuran, emptyMsg) {
  const rows = bulanIniRows(namaIuran);
  const wrap = document.getElementById(containerId);
  if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><div class="empty-state__title">${emptyMsg}</div></div>`; return; }
  wrap.innerHTML = `<div class="card" style="padding:4px 16px;">` + rows.map(r => `
    <div class="list-item d-flex align-items-center gap-2 py-2" style="border-bottom:1px solid var(--color-border);">
      <div class="avatar" style="width:38px;height:38px;border-radius:999px;background:var(--color-primary-container);color:var(--color-primary);display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:13px;font-weight:700;">${(r.kartu_keluarga?.no_kk || '?').slice(-2)}</div>
      <div class="flex-fill" style="min-width:0;">
        <div class="fw-semibold text-truncate" style="font-size:14px;">${r.kartu_keluarga?.no_kk || 'Tanpa KK'}</div>
        <div class="text-caption">${formatTanggalIndo(r.tanggal_transaksi)}${r.keterangan ? ' · ' + r.keterangan : ''}</div>
      </div>
      <div class="mono fw-semibold" style="color:var(--color-success);">+${formatRupiah(r.nominal)}</div>
    </div>
  `).join('') + `</div>`;
}

function renderIuranWarga() {
  renderListSetoran('kr-iuran-list', 'Kas', 'Belum ada setoran kas bulan ini');
}
function renderArisanWarga() {
  renderListSetoran('kr-arisan-list', 'Arisan', 'Belum ada setoran arisan bulan ini');
}

function renderFilterJenis() {
  const wrap = document.getElementById('kr-filter-jenis');
  const chips = [{ id: '', label: 'Semua' }, ...jenisIuranList.map(j => ({ id: j.id, label: j.nama_iuran }))];
  wrap.innerHTML = chips.map((c, i) => `<div class="chip${i === 0 ? ' active' : ''}" data-jenis="${c.id}">${c.label}</div>`).join('');
  wrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderRiwayat(chip.dataset.jenis);
    });
  });
}

function renderRiwayat(filterJenisId = '') {
  const rows = filterJenisId ? semuaTransaksi.filter(r => r.jenis_iuran_id === filterJenisId) : semuaTransaksi;
  const wrap = document.getElementById('kr-riwayat-list');
  if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><div class="empty-state__title">Belum ada transaksi</div></div>`; return; }
  wrap.innerHTML = `<div class="card" style="padding:4px 16px;">` + rows.slice(0, 50).map(r => `
    <div class="list-item d-flex align-items-center gap-2 py-2" style="border-bottom:1px solid var(--color-border);">
      <div style="font-size:18px;">🧾</div>
      <div class="flex-fill" style="min-width:0;">
        <div class="fw-semibold text-truncate" style="font-size:14px;">${r.jenis_iuran?.nama_iuran || r.keterangan || 'Transaksi'}</div>
        <div class="text-caption">${formatTanggalIndo(r.tanggal_transaksi)}${r.kartu_keluarga?.no_kk ? ' · KK ' + r.kartu_keluarga.no_kk : ''}</div>
      </div>
      <div class="mono fw-semibold" style="color:${r.tipe === 'pemasukan' ? 'var(--color-success)' : 'var(--color-danger)'};">
        ${r.tipe === 'pemasukan' ? '+' : '−'}${formatRupiah(r.nominal)}
      </div>
    </div>
  `).join('') + `</div>`;
}

function setupTabs() {
  document.querySelectorAll('#kr-tabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => aktifkanTab(tab.dataset.tab));
  });
}
function aktifkanTab(key) {
  document.querySelectorAll('#kr-tabs .tab-item').forEach(t => t.classList.toggle('active', t.dataset.tab === key));
  document.querySelectorAll('.kr-panel').forEach(p => { p.style.display = p.dataset.panel === key ? 'block' : 'none'; });
}

async function simpanTransaksi() {
  const tipe = document.getElementById('kr_tipe').value;
  const nominal = Number(document.getElementById('kr_nominal').value);
  const tanggal = document.getElementById('kr_tanggal').value;
  const keterangan = document.getElementById('kr_keterangan').value.trim();
  const jenisIuranId = tipe === 'pemasukan' ? (document.getElementById('kr_jenis_iuran').value || null) : null;
  const kkId = document.getElementById('kr_kk').value || null;

  if (!nominal || nominal <= 0) { alert('Nominal harus lebih dari 0.'); return; }
  if (!tanggal) { alert('Tanggal wajib diisi.'); return; }

  let buktiUrl = null;
  const fileInput = document.getElementById('kr_bukti');
  const status = document.getElementById('kr_bukti_status');
  if (fileInput.files?.[0]) {
    const file = fileInput.files[0];
    const path = `rt/${profileAktif.wilayah_rt_id}/${Date.now()}-${file.name}`;
    status.textContent = 'Mengunggah bukti...';
    const { error: uploadErr } = await supabase.storage.from('bukti-transaksi').upload(path, file);
    if (uploadErr) { status.textContent = `Gagal unggah bukti: ${uploadErr.message}`; }
    else { buktiUrl = path; status.textContent = 'Bukti berhasil diunggah.'; }
  }

  const payload = {
    wilayah_rt_id: profileAktif.wilayah_rt_id,
    jenis_iuran_id: jenisIuranId,
    kk_id: kkId,
    tipe,
    nominal,
    keterangan: keterangan || null,
    tanggal_transaksi: tanggal,
    dicatat_oleh: profileAktif.id,
    bukti_url: buktiUrl,
  };

  const { error } = await supabase.from('transaksi_keuangan_rt').insert(payload);
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }

  modal.hide();
  document.getElementById('kr_nominal').value = '';
  document.getElementById('kr_keterangan').value = '';
  fileInput.value = '';
  status.textContent = '';

  await muatSemuaTransaksi();
  renderHero(); renderChart(); renderKomposisi(); renderIuranWarga(); renderArisanWarga(); renderRiwayat();
}
