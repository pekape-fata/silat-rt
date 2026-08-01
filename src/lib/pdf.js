// =========================================================
// SILAT RT — src/lib/pdf.js
// Cetak/Export surat resmi ke PDF menggunakan jsPDF (CDN, gratis).
// Dipakai oleh halaman preview-surat & laporan keuangan.
// =========================================================
import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm';

/**
 * Cetak surat resmi ke PDF (kop, isi, TTD/stempel, QR verifikasi).
 * @param {object} surat - data surat lengkap (join warga, jenis_surat, ttd)
 * @param {object} opts - { autoDownload: boolean, fileName: string }
 */
export function cetakSuratPDF(surat, opts = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginX = 20;
  let y = 20;

  // Kop surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PEMERINTAH KOTA MALANG', 105, y, { align: 'center' }); y += 5;
  doc.text('KECAMATAN BLIMBING — KELURAHAN PURWANTORO', 105, y, { align: 'center' }); y += 5;
  doc.setFontSize(14);
  doc.text('RUKUN TETANGGA 01 / RUKUN WARGA 09', 105, y, { align: 'center' }); y += 3;
  doc.setLineWidth(0.6);
  doc.line(marginX, y, 210 - marginX, y); y += 10;

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

  // Placeholder QR verifikasi (di-generate terpisah lewat lib/qrcode.js lalu ditempel sebagai gambar)
  if (surat.qr_data_url) {
    doc.addImage(surat.qr_data_url, 'PNG', marginX, y + 12, 25, 25);
    doc.setFontSize(8);
    doc.text('Pindai untuk verifikasi keaslian surat', marginX, y + 40);
  }

  const fileName = opts.fileName || `${(surat.nomor_surat || 'surat').replace(/\//g, '-')}.pdf`;
  if (opts.autoDownload !== false) {
    doc.save(fileName);
  }
  return doc;
}
