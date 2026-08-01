// =========================================================
// SILAT RT — src/lib/format.js
// =========================================================

export function formatRupiah(nominal) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
    .format(Number(nominal || 0));
}

export function formatTanggalIndo(dateInput, withTime = false) {
  const d = new Date(dateInput);
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('id-ID', opts);
}

const BULAN_ROMAWI = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

/** Generate nomor surat sesuai format {no}/{jenis}/{rt}/{bulan_romawi}/{tahun} */
export function generateNomorSurat({ urut, kodeJenis, rt = '01', tanggal = new Date() }) {
  const bulan = BULAN_ROMAWI[tanggal.getMonth()];
  const tahun = tanggal.getFullYear();
  const nomor = String(urut).padStart(3, '0');
  return `${nomor}/${kodeJenis}/RT${rt}/${bulan}/${tahun}`;
}

export function maskNIK(nik) {
  if (!nik || nik.length < 10) return nik;
  return nik.slice(0, 6) + '••••••' + nik.slice(-4);
}
