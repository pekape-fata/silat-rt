// =========================================================
// SILAT RT — src/lib/pdf.js
// Cetak/Export surat resmi ke PDF menggunakan jsPDF (CDN, gratis).
// Dipakai oleh halaman preview-surat & laporan keuangan.
//
// PERUBAHAN: kop surat sebelumnya digambar manual pakai teks
// (hardcode "PEMERINTAH KOTA MALANG..."). Sekarang memakai gambar
// kop asli yang sudah disediakan pengurus, ditempatkan di
// public/assets/kop/:
//   - kop-rt-001-rw-009.png   -> untuk semua surat dari tabel
//     `surat` (Surat Pengantar KTP/KK/SKCK, Surat Keterangan
//     Domisili/Usaha, dst — semua terbit atas nama RT).
//   - kop-al-muchtarom.png    -> disiapkan untuk surat/undangan
//     terbitan Langgar Waqaf Al Muchtarom (fitur `surat_undangan`
//     belum dibangun di UI saat ini, fungsinya disiapkan lebih
//     dulu supaya tinggal dipakai nanti).
// =========================================================
import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm';

const KOP_RT = '/assets/kop/kop-rt-001-rw-009.png';
const KOP_TAKMIR = '/assets/kop/kop-al-muchtarom.png';

// Rasio asli gambar kop ±4,5:1 (lebar:tinggi) — lebar dikunci mengikuti
// area cetak A4 (210mm - margin kiri-kanan), tinggi menyesuaikan rasio.
const KOP_RATIO = 4.5;

/**
 * Memuat gambar kop sebagai elemen <img> siap pakai jsPDF.addImage.
 * Di-cache di memori supaya tidak fetch berulang kali kalau user
 * mencetak beberapa surat berturut-turut.
 */
const _kopCache = new Map();
function muatGambarKop(src) {
  if (_kopCache.has(src)) return _kopCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat kop surat: ${src}`));
    img.src = src;
  });
  _kopCache.set(src, promise);
  return promise;
}

/**
 * Menempelkan gambar kop surat di bagian atas dokumen + garis pembatas.
 * @returns {number} posisi Y setelah kop (untuk lanjutan konten di bawahnya)
 */
async function tempelKop(doc, kopSrc, marginX) {
  const lebarKop = 210 - marginX * 2;
  const tinggiKop = lebarKop / KOP_RATIO;
  let y = 12;

  try {
    const img = await muatGambarKop(kopSrc);
    doc.addImage(img, 'PNG', marginX, y, lebarKop, tinggiKop);
  } catch (err) {
    // Fallback kalau gambar gagal dimuat (mis. offline) — jangan sampai
    // proses cetak berhenti total, tampilkan placeholder teks tipis.
    console.error(err.message);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('[Kop surat tidak dapat dimuat]', marginX, y + tinggiKop / 2);
    doc.setTextColor(0);
  }

  y += tinggiKop + 4;
  doc.setLineWidth(0.8);
  doc.line(marginX, y, 210 - marginX, y);
  doc.setLineWidth(0.3);
  doc.line(marginX, y + 1, 210 - marginX, y + 1);
  y += 10;
  return y;
}

/**
 * Cetak surat resmi terbitan RT ke PDF (kop RT, isi, TTD/stempel
 * berjenjang RT->RW, QR verifikasi).
 * @param {object} surat - data surat lengkap (join warga, jenis_surat, ttd)
 * @param {object} opts - { autoDownload: boolean, fileName: string }
 */
export async function cetakSuratPDF(surat, opts = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginX = 20;

  let y = await tempelKop(doc, KOP_RT, marginX);

  // Judul
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(surat.jenis_surat_nama?.toUpperCase() || 'SURAT KETERANGAN', 105, y, { align: 'center' }); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${surat.nomor_surat || '-'}`, 105, y, { align: 'center' }); y += 12;

  // Isi surat
  doc.setFontSize(11);
  const isi = doc.splitTextToSize(surat.isi_surat || '', 210 - marginX * 2);
  doc.text(isi, marginX, y);
  y += isi.length * 6 + 10;

  // Blok tanda tangan berjenjang (RT -> RW, revisi 05e)
  const kolomKiri = marginX;
  const kolomKanan = 210 - marginX - 60;

  doc.text('Mengetahui,', kolomKiri, y);
  doc.text(`Malang, ${surat.tanggal_terbit_format || '-'}`, kolomKanan, y);
  y += 5;
  doc.text(surat.atas_nama_pelimpahan_rw ? 'u.b. Ketua RW 09' : 'Ketua RW 09', kolomKiri, y);
  doc.text('Ketua RT 01', kolomKanan, y);
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${surat.nama_penandatangan_rw || '.........................'} )`, kolomKiri, y);
  doc.text(`( ${surat.atas_nama_pelimpahan_rt ? 'u.b. ' : ''}${surat.nama_penandatangan_rt || '.........................'} )`, kolomKanan, y);

  // QR verifikasi (di-generate terpisah lewat lib/qrcode.js lalu ditempel sebagai gambar)
  if (surat.qr_data_url) {
    doc.addImage(surat.qr_data_url, 'PNG', marginX, y + 12, 25, 25);
    doc.setFontSize(8);
    doc.text('Pindai untuk verifikasi keaslian surat', marginX, y + 40);
  }

  const fileName = opts.fileName || `${(surat.nomor_surat || 'surat').replace(/\//g, '-')}.pdf`;
  if (opts.mode === 'print') {
    // CETAK: buka dialog cetak browser langsung (tanpa memaksa unduh file)
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else if (opts.autoDownload !== false) {
    // UNDUH: simpan file PDF langsung ke perangkat
    doc.save(fileName);
  }
  return doc;
}

/**
 * Cetak surat/undangan terbitan Langgar Waqaf Al Muchtarom ke PDF
 * (kop Langgar, isi, satu blok TTD Ketua/Sekretaris Takmir).
 *
 * DISIAPKAN LEBIH DULU: belum dipakai di UI manapun saat ini karena
 * fitur surat_undangan/daftar-undangan belum dibangun (lihat
 * docs/07-struktur-folder.md). Struktur menyusul pola cetakSuratPDF
 * di atas supaya konsisten begitu fitur itu mulai dikerjakan.
 *
 * @param {object} undangan - { judul, nomor, isi, tanggal_format,
 *   nama_penandatangan, jabatan_penandatangan (default 'Ketua Takmir'),
 *   qr_data_url }
 * @param {object} opts - { autoDownload: boolean, fileName: string }
 */
export async function cetakSuratTakmirPDF(undangan, opts = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginX = 20;

  let y = await tempelKop(doc, KOP_TAKMIR, marginX);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(undangan.judul?.toUpperCase() || 'SURAT', 105, y, { align: 'center' }); y += 5;
  doc.setFont('helvetica', 'normal');
  if (undangan.nomor) {
    doc.text(`Nomor: ${undangan.nomor}`, 105, y, { align: 'center' }); y += 12;
  } else {
    y += 8;
  }

  doc.setFontSize(11);
  const isi = doc.splitTextToSize(undangan.isi || '', 210 - marginX * 2);
  doc.text(isi, marginX, y);
  y += isi.length * 6 + 15;

  // Blok tanda tangan tunggal (Ketua/Sekretaris Takmir)
  const kolomKanan = 210 - marginX - 60;
  doc.text(`Malang, ${undangan.tanggal_format || '-'}`, kolomKanan, y);
  y += 5;
  doc.text(undangan.jabatan_penandatangan || 'Ketua Takmir', kolomKanan, y);
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${undangan.nama_penandatangan || '.........................'} )`, kolomKanan, y);

  if (undangan.qr_data_url) {
    doc.addImage(undangan.qr_data_url, 'PNG', marginX, y - 22, 25, 25);
    doc.setFontSize(8);
    doc.text('Pindai untuk verifikasi keaslian surat', marginX, y - 22 + 28);
  }

  const fileName = opts.fileName || `${(undangan.nomor || 'undangan').replace(/\//g, '-')}.pdf`;
  if (opts.autoDownload !== false) {
    doc.save(fileName);
  }
  return doc;
}
