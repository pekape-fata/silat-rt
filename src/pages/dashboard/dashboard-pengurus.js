// src/pages/dashboard/dashboard-pengurus.js
import { supabase } from '../../lib/supabaseClient.js';
import { requireLogin } from '../../lib/auth.js';
import { getNavForRole } from '../../lib/rbac.js';
import { formatRupiah, formatTanggalIndo } from '../../lib/format.js';

const ROLE_RT_WRITE = ['Bendahara RT'];
const ROLE_TAKMIR_WRITE = ['Bendahara Takmir'];

export async function init() {
  const profile = await requireLogin();
  if (!profile) return;

  const nav = getNavForRole(profile.role);
  const hasRT = nav.includes('keuangan-rt') || nav.includes('laporan-rt');
  const hasTakmir = nav.includes('kas-takmir') || nav.includes('laporan-takmir');
  const isBendaharaRT = ROLE_RT_WRITE.includes(profile.role);
  const isBendaharaTakmir = ROLE_TAKMIR_WRITE.includes(profile.role);

  greet(profile);

  const [rtTotals, takmirTotals] = await Promise.all([
    hasRT ? hitungTotal('transaksi_keuangan_rt') : null,
    hasTakmir ? hitungTotal('transaksi_keuangan_takmir') : null,
  ]);

  renderStatGrid({ profile, hasRT, hasTakmir, rtTotals, takmirTotals });
  renderQuickActions({ isBendaharaRT, isBendaharaTakmir });

  if (hasRT || hasTakmir) {
    renderChart({ hasRT, hasTakmir });
  }
  if (hasRT) {
    renderIuranBulanIni();
  }
  if (hasRT || hasTakmir) {
    renderTransaksiTerbaru({ hasRT, hasTakmir });
  }

  await renderNotifikasiSurat(profile.role);
  renderAgenda();
  renderPengumuman();
}

async function renderNotifikasiSurat(role) {
  // Setiap tahap alur surat butuh role berbeda untuk bertindak
  // (sinkron dengan SURAT_WORKFLOW_ROLE di rbac.js / RLS migrasi 007).
  const TAHAP = {
    'Sekretaris RT': { status: 'menunggu_verifikasi', href: '#/antrian-surat', label: 'menunggu diverifikasi' },
    'Ketua RT':      { status: 'terverifikasi_sekretaris_rt', href: '#/preview-surat', label: 'menunggu tanda tangan Anda' },
    'Ketua RW':      { status: 'ditandatangani_rt', href: '#/approval-surat', label: 'menunggu tindakan RW' },
    'Sekretaris RW': { status: 'ditandatangani_rt', href: '#/approval-surat', label: 'menunggu tindakan RW' },
  };
  const tahap = TAHAP[role];
  const card = document.getElementById('dash-surat-card');
  if (!tahap) { card.style.display = 'none'; return; }

  const { count, error } = await supabase
    .from('surat')
    .select('id', { count: 'exact', head: true })
    .eq('status', tahap.status);

  if (error || !count) { card.style.display = 'none'; return; }

  document.getElementById('dash-surat-judul').textContent = `${count} surat ${tahap.label}`;
  document.getElementById('dash-surat-sub').textContent = 'Ketuk untuk membuka';
  card.href = tahap.href;
  card.style.display = 'flex';
}

function greet(profile) {
  const jam = new Date().getHours();
  const sapaan = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam';
  document.getElementById('dash-greeting').textContent = `${sapaan}, ${profile.nama_lengkap || profile.username} 👋`;
  document.getElementById('dash-subtitle').textContent = `${profile.role || ''}`;
}

async function hitungTotal(table) {
  const { data, error } = await supabase.from(table).select('tipe, nominal, tanggal_transaksi');
  if (error) { console.error(error.message); return { masuk: 0, keluar: 0, saldo: 0, rows: [] }; }
  let masuk = 0, keluar = 0;
  data.forEach(r => { if (r.tipe === 'pemasukan') masuk += Number(r.nominal); else keluar += Number(r.nominal); });
  return { masuk, keluar, saldo: masuk - keluar, rows: data };
}

function renderStatGrid({ profile, hasRT, hasTakmir, rtTotals, takmirTotals }) {
  const cards = [];

  if (hasRT) {
    cards.push(statCardHtml({
      value: formatRupiah(rtTotals.saldo), label: 'Saldo Kas RT', color: 'var(--color-success)',
      bg: 'var(--color-success-container)', href: '#/keuangan-rt',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M21 12h-4a2 2 0 0 0 0 4h4"/></svg>',
    }));
  }
  if (hasTakmir) {
    cards.push(statCardHtml({
      value: formatRupiah(takmirTotals.saldo), label: 'Saldo Kas Takmir', color: 'var(--color-primary)',
      bg: 'var(--color-primary-container)', href: '#/keuangan-takmir',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21v-7l7-6 7 6v7"/><path d="M12 3v3M9 9a3 3 0 0 1 6 0"/></svg>',
    }));
  }

  document.getElementById('dash-stat-grid').innerHTML = cards.map(c => `<div class="col-6">${c}</div>`).join('');

  // Statistik warga/KK — hanya untuk peran yang berkaitan dengan administrasi RT
  if (['Ketua RT', 'Sekretaris RT', 'Bendahara RT', 'Administrator'].includes(profile.role)) {
    muatStatistikWarga();
  }
}

function statCardHtml({ value, label, color, bg, href, icon }) {
  const iconHtml = icon ? `<div class="stat-icon" style="background:${bg || 'var(--color-surface-alt)'};color:${color};">${icon}</div>` : '';
  const inner = `
    <div class="card stat-card card-body card-hover">
      ${iconHtml}
      <div class="stat-value mono" style="color:${color};">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
  return href ? `<a class="stat-card-link" href="${href}">${inner}</a>` : inner;
}

async function muatStatistikWarga() {
  const [{ count: wargaCount }, { count: kkCount }] = await Promise.all([
    supabase.from('warga').select('id', { count: 'exact', head: true }),
    supabase.from('kartu_keluarga').select('id', { count: 'exact', head: true }),
  ]);
  const grid = document.getElementById('dash-stat-grid');
  grid.insertAdjacentHTML('beforeend', `
    <div class="col-6">
      <div class="card stat-card card-body"><div class="stat-value">${wargaCount ?? '–'}</div><div class="stat-label">Warga Terdaftar</div></div>
    </div>
    <div class="col-6">
      <div class="card stat-card card-body"><div class="stat-value">${kkCount ?? '–'}</div><div class="stat-label">Kartu Keluarga</div></div>
    </div>
  `);
}

function renderQuickActions({ isBendaharaRT, isBendaharaTakmir }) {
  const wrap = document.getElementById('dash-quick-actions');
  const actions = [];
  if (isBendaharaRT) {
    actions.push({ icon: '➕', label: 'Catat Iuran/Kas RT', href: '#/keuangan-rt?aksi=catat' });
    actions.push({ icon: '📊', label: 'Laporan Kas RT', href: '#/keuangan-rt?tab=laporan' });
  }
  if (isBendaharaTakmir) {
    actions.push({ icon: '➕', label: 'Catat Kas Takmir', href: '#/keuangan-takmir?aksi=catat' });
    actions.push({ icon: '📊', label: 'Laporan Kas Takmir', href: '#/keuangan-takmir?tab=laporan' });
  }
  if (!actions.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'grid';
  wrap.innerHTML = actions.map(a => `
    <a class="quick-action" href="${a.href}">
      <span class="qa-icon">${a.icon}</span><span class="qa-label">${a.label}</span>
    </a>
  `).join('');
}

let chartState = { hasRT: false, hasTakmir: false, mode: 'rt' };

async function renderChart({ hasRT, hasTakmir }) {
  chartState = { hasRT, hasTakmir, mode: hasRT ? 'rt' : 'takmir' };
  const card = document.getElementById('dash-chart-card');
  card.style.display = 'block';

  const toggleLabel = document.getElementById('dash-chart-toggle-label');
  if (hasRT && hasTakmir) {
    toggleLabel.style.display = 'inline';
    toggleLabel.addEventListener('click', async () => {
      chartState.mode = chartState.mode === 'rt' ? 'takmir' : 'rt';
      toggleLabel.textContent = chartState.mode === 'rt' ? 'Kas RT ⇄' : 'Kas Takmir ⇄';
      await gambarChart(chartState.mode);
    });
    toggleLabel.textContent = 'Kas RT ⇄';
  } else {
    toggleLabel.textContent = hasRT ? 'Kas RT' : 'Kas Takmir';
    toggleLabel.style.cursor = 'default';
  }

  await gambarChart(chartState.mode);
}

async function gambarChart(mode) {
  const table = mode === 'rt' ? 'transaksi_keuangan_rt' : 'transaksi_keuangan_takmir';
  const wrap = document.getElementById('dash-chart-wrap');
  wrap.innerHTML = `<div class="skeleton" style="height:90px;"></div>`;

  const sejak = new Date();
  sejak.setMonth(sejak.getMonth() - 5);
  sejak.setDate(1);

  const { data, error } = await supabase
    .from(table)
    .select('tipe, nominal, tanggal_transaksi')
    .gte('tanggal_transaksi', sejak.toISOString().slice(0, 10));

  if (error) { wrap.innerHTML = `<div class="alert alert-danger small">${error.message}</div>`; return; }

  const bulanLabel = [];
  const perBulan = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    bulanLabel.push({ key, label: d.toLocaleDateString('id-ID', { month: 'short' }) });
    perBulan[key] = { masuk: 0, keluar: 0 };
  }
  (data || []).forEach(r => {
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

  wrap.innerHTML = `<svg class="mini-bar-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
}

async function renderIuranBulanIni() {
  const card = document.getElementById('dash-iuran-card');
  card.style.display = 'block';
  const body = document.getElementById('dash-iuran-body');

  const awalBulan = new Date(); awalBulan.setDate(1);
  const awalStr = awalBulan.toISOString().slice(0, 10);

  const [{ data: trx, error: e1 }, { count: totalKK, error: e2 }] = await Promise.all([
    supabase.from('transaksi_keuangan_rt').select('kk_id').eq('tipe', 'pemasukan').gte('tanggal_transaksi', awalStr).not('kk_id', 'is', null),
    supabase.from('kartu_keluarga').select('id', { count: 'exact', head: true }),
  ]);

  if (e1 || e2) { body.innerHTML = `<div class="alert alert-danger small">${(e1 || e2).message}</div>`; return; }

  const sudahBayar = new Set((trx || []).map(t => t.kk_id)).size;
  const total = totalKK || 0;
  const pct = total ? Math.round((sudahBayar / total) * 100) : 0;

  body.innerHTML = `
    <div class="d-flex justify-content-between align-items-baseline mb-2">
      <span class="fw-semibold">${sudahBayar} dari ${total} KK sudah mencatat setoran</span>
      <span class="mono fw-bold" style="color:var(--color-primary);">${pct}%</span>
    </div>
    <div style="height:8px;border-radius:999px;background:var(--color-border);overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:var(--color-primary);"></div>
    </div>
    <div class="text-caption mt-2">Termasuk iuran kas, sampah, keamanan, jimpitan, dan arisan bulan ini.</div>
  `;
}

async function renderTransaksiTerbaru({ hasRT, hasTakmir }) {
  const card = document.getElementById('dash-transaksi-card');
  card.style.display = 'block';
  const list = document.getElementById('dash-transaksi-list');

  const queries = [];
  if (hasRT) queries.push(
    supabase.from('transaksi_keuangan_rt').select('id, tipe, nominal, keterangan, tanggal_transaksi, jenis_iuran:jenis_iuran_id (nama_iuran)')
      .order('tanggal_transaksi', { ascending: false }).limit(5)
  );
  if (hasTakmir) queries.push(
    supabase.from('transaksi_keuangan_takmir').select('id, tipe, nominal, keterangan, tanggal_transaksi, kategori:kategori_id (nama_kategori)')
      .order('tanggal_transaksi', { ascending: false }).limit(5)
  );

  const results = await Promise.all(queries);
  let rows = [];
  results.forEach(({ data, error }, idx) => {
    if (error) { console.error(error.message); return; }
    (data || []).forEach(r => rows.push({
      ...r,
      sumber: (hasRT && idx === 0) ? 'RT' : 'Takmir',
      judul: r.jenis_iuran?.nama_iuran || r.kategori?.nama_kategori || r.keterangan || 'Transaksi',
    }));
  });
  rows.sort((a, b) => new Date(b.tanggal_transaksi) - new Date(a.tanggal_transaksi));
  rows = rows.slice(0, 6);

  if (!rows.length) { list.innerHTML = `<div class="empty-state"><div class="empty-state__title">Belum ada transaksi</div></div>`; return; }

  list.innerHTML = rows.map(r => `
    <div class="list-item d-flex align-items-center gap-2 py-2" style="border-bottom:1px solid var(--color-border);">
      <div class="avatar" style="width:40px;height:40px;border-radius:999px;background:var(--color-primary-container);color:var(--color-primary);display:flex;align-items:center;justify-content:center;flex:0 0 auto;">${r.sumber === 'RT' ? '🏘️' : '🕌'}</div>
      <div class="flex-fill" style="min-width:0;">
        <div class="fw-semibold text-truncate" style="font-size:14px;">${r.judul}</div>
        <div class="text-caption">${r.sumber} · ${formatTanggalIndo(r.tanggal_transaksi)}</div>
      </div>
      <div class="mono fw-semibold" style="color:${r.tipe === 'pemasukan' ? 'var(--color-success)' : 'var(--color-danger)'};">
        ${r.tipe === 'pemasukan' ? '+' : '−'}${formatRupiah(r.nominal)}
      </div>
    </div>
  `).join('');
}

async function renderAgenda() {
  const card = document.getElementById('dash-agenda-card');
  const list = document.getElementById('dash-agenda-list');
  const { data, error } = await supabase
    .from('agenda').select('judul, tanggal_mulai, lokasi')
    .gte('tanggal_mulai', new Date().toISOString())
    .order('tanggal_mulai', { ascending: true }).limit(3);
  if (error || !data?.length) return;
  card.style.display = 'block';
  list.innerHTML = data.map(a => `
    <div class="list-item d-flex align-items-center gap-2 py-2" style="border-bottom:1px solid var(--color-border);">
      <div style="font-size:20px;">📅</div>
      <div>
        <div class="fw-semibold" style="font-size:14px;">${a.judul}</div>
        <div class="text-caption">${formatTanggalIndo(a.tanggal_mulai, true)}${a.lokasi ? ' · ' + a.lokasi : ''}</div>
      </div>
    </div>
  `).join('');
}

async function renderPengumuman() {
  const card = document.getElementById('dash-pengumuman-card');
  const list = document.getElementById('dash-pengumuman-list');
  const { data, error } = await supabase
    .from('pengumuman').select('judul, created_at')
    .order('created_at', { ascending: false }).limit(3);
  if (error || !data?.length) return;
  card.style.display = 'block';
  list.innerHTML = data.map(p => `
    <div class="list-item d-flex align-items-center gap-2 py-2" style="border-bottom:1px solid var(--color-border);">
      <div style="font-size:20px;">📣</div>
      <div>
        <div class="fw-semibold" style="font-size:14px;">${p.judul}</div>
        <div class="text-caption">${formatTanggalIndo(p.created_at, true)}</div>
      </div>
    </div>
  `).join('');
}
