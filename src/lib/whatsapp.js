// =========================================================
// SILAT RT — src/lib/whatsapp.js
// Hanya membangun link wa.me — TIDAK memakai WhatsApp API berbayar.
// Admin/pengurus selalu meninjau pesan di aplikasi WhatsApp sebelum kirim.
// =========================================================

/** Bersihkan nomor HP ke format internasional 62xxxx tanpa simbol */
export function normalizeNoWA(noHp) {
  let n = String(noHp || '').replace(/[^0-9]/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  if (!n.startsWith('62')) n = '62' + n;
  return n;
}

export function buildWaLink(noHp, pesan) {
  const nomor = normalizeNoWA(noHp);
  const teks = encodeURIComponent(pesan);
  return `https://wa.me/${nomor}?text=${teks}`;
}

export function templatePerluPerbaikan({ namaPemohon, jenisSurat, catatan, linkPerbaikan }) {
  return (
    `Assalamu'alaikum ${namaPemohon},\n\n` +
    `Pengajuan ${jenisSurat} Anda perlu dilengkapi/diperbaiki:\n"${catatan}"\n\n` +
    `Silakan perbaiki melalui tautan berikut:\n${linkPerbaikan}\n\n` +
    `Terima kasih — Sekretariat RT 01/RW 09 Purwantoro`
  );
}

export function templateSuratTerbit({ namaPemohon, jenisSurat, nomorSurat, linkUnduh }) {
  return (
    `Assalamu'alaikum ${namaPemohon},\n\n` +
    `${jenisSurat} Anda (No. ${nomorSurat}) sudah terbit dan siap diunduh:\n${linkUnduh}\n\n` +
    `Terima kasih — Sekretariat RT 01/RW 09 Purwantoro`
  );
}
