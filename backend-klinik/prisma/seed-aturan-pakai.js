require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ATURAN_PAKAI_DATA = [
  /* ── LATIN ── */
  { cat:'latin', variants:['od','omni die','o.d.'], norm:'1x1', freqDay:1, dosePerTake:'1', timing:['bebas'], catatan:'Sekali sehari, waktu tidak ditentukan kecuali ada tambahan', penting:false },
  { cat:'latin', variants:['bd','bis die','bid','b.i.d.','b.d.'], norm:'2x1', freqDay:2, dosePerTake:'1', timing:['pagi','malam'], catatan:'Dua kali sehari. Umumnya pagi dan malam.', penting:false },
  { cat:'latin', variants:['tds','ter die sumendus','tid','t.i.d.','t.d.s.'], norm:'3x1', freqDay:3, dosePerTake:'1', timing:['pagi','siang','malam'], catatan:'Tiga kali sehari. Paling umum ditulis dokter Indonesia.', penting:true },
  { cat:'latin', variants:['qid','quater in die','q.i.d.'], norm:'4x1', freqDay:4, dosePerTake:'1', timing:['pagi','siang','sore','malam'], catatan:'Empat kali sehari, interval kurang lebih 6 jam.', penting:false },
  { cat:'latin', variants:['q4h','q.4.h.','setiap 4 jam'], norm:'q4h', freqDay:6, dosePerTake:'1', timing:['setiap 4 jam'], catatan:'Setiap 4 jam termasuk malam. Penting untuk antibiotik level-dependent.', penting:true },
  { cat:'latin', variants:['q6h','q.6.h.','setiap 6 jam'], norm:'q6h', freqDay:4, dosePerTake:'1', timing:['setiap 6 jam'], catatan:'Setiap 6 jam. Setara qid tapi dengan penekanan interval ketat.', penting:false },
  { cat:'latin', variants:['q8h','q.8.h.','setiap 8 jam'], norm:'q8h', freqDay:3, dosePerTake:'1', timing:['setiap 8 jam'], catatan:'Setiap 8 jam. Setara tds tapi interval lebih ketat (contoh: antibiotik).', penting:true },
  { cat:'latin', variants:['q12h','q.12.h.','setiap 12 jam'], norm:'q12h', freqDay:2, dosePerTake:'1', timing:['setiap 12 jam'], catatan:'Setiap 12 jam. Lebih ketat dari bd — biasanya untuk antibiotik atau obat level darah.', penting:false },
  { cat:'latin', variants:['prn','p.r.n.','k/p','kalau perlu','bila perlu','jika perlu'], norm:'prn', freqDay:0, dosePerTake:'1', timing:['prn'], catatan:'Kondisional. Biasanya disertai kondisi dan batas maksimal dosis/hari.', penting:true },
  { cat:'latin', variants:['sos','si opus sit','s.o.s.'], norm:'sos', freqDay:0, dosePerTake:'1', timing:['prn'], catatan:'Mirip prn tapi hanya sekali. Jika tidak membaik, hentikan atau ganti.', penting:false },
  { cat:'latin', variants:['stat','s.t.a.t.','segera','sekarang'], norm:'stat', freqDay:1, dosePerTake:'1', timing:['stat'], catatan:'Berikan segera saat itu juga. Untuk dosis loading atau kondisi darurat.', penting:true },
  { cat:'latin', variants:['ac','ante cibum','sebelum makan','a.c.'], norm:'ac', freqDay:null, dosePerTake:null, timing:['sebelum-makan'], catatan:'Modifikasi WAKTU, bukan frekuensi. Dikombinasikan: tds ac = 3x1 sebelum makan.', penting:true },
  { cat:'latin', variants:['pc','post cibum','setelah makan','sesudah makan','p.c.'], norm:'pc', freqDay:null, dosePerTake:null, timing:['makan'], catatan:'Modifikasi WAKTU. tds pc = 3x1 setelah makan. Paling umum di Indonesia.', penting:true },
  { cat:'latin', variants:['hs','hora somni','sebelum tidur','menjelang tidur','h.s.'], norm:'hs', freqDay:1, dosePerTake:'1', timing:['tidur'], catatan:'Satu kali, saat akan tidur malam. Untuk statin, antihistamin, hipnotik.', penting:true },
  { cat:'latin', variants:['mane','pagi hari','pagi'], norm:'mane', freqDay:1, dosePerTake:'1', timing:['pagi'], catatan:'Sekali sehari, pagi hari. Untuk diuretik, kortikosteroid (ikuti ritme kortisol).', penting:true },
  { cat:'latin', variants:['nocte','malam hari','malam'], norm:'nocte', freqDay:1, dosePerTake:'1', timing:['malam'], catatan:'Sekali sehari, malam hari. Untuk statin (efek optimal malam), beberapa antihipertensi.', penting:true },

  /* ── ANGKA INDONESIA ── */
  { cat:'indo', variants:['3x1','3 x 1','3×1'], norm:'3x1', freqDay:3, dosePerTake:'1 tab', timing:['pagi','siang','malam'], catatan:'Format paling umum di Indonesia. Tiga kali sehari satu tablet.', penting:true },
  { cat:'indo', variants:['2x1','2 x 1','2×1'], norm:'2x1', freqDay:2, dosePerTake:'1 tab', timing:['pagi','malam'], catatan:'Dua kali sehari satu tablet.', penting:true },
  { cat:'indo', variants:['1x1','1 x 1','1×1'], norm:'1x1', freqDay:1, dosePerTake:'1 tab', timing:['bebas'], catatan:'Sekali sehari satu tablet. Biasanya diikuti keterangan waktu.', penting:true },
  { cat:'indo', variants:['4x1','4 x 1'], norm:'4x1', freqDay:4, dosePerTake:'1 tab', timing:['pagi','siang','sore','malam'], catatan:'Empat kali sehari.', penting:false },
  { cat:'indo', variants:['3x2','3 x 2'], norm:'3x2', freqDay:3, dosePerTake:'2 tab', timing:['pagi','siang','malam'], catatan:'Tiga kali sehari DUA tablet. Perhatikan dosis total.', penting:true },
  { cat:'indo', variants:['2x2','2 x 2'], norm:'2x2', freqDay:2, dosePerTake:'2 tab', timing:['pagi','malam'], catatan:'Dua kali sehari dua tablet.', penting:false },
  { cat:'indo', variants:['3x½','3x1/2','3 x ½'], norm:'3x½', freqDay:3, dosePerTake:'½ tab', timing:['pagi','siang','malam'], catatan:'Tiga kali sehari setengah tablet. Umum untuk antihipertensi dosis rendah.', penting:true },
  { cat:'indo', variants:['2x½','2x1/2','2 x ½'], norm:'2x½', freqDay:2, dosePerTake:'½ tab', timing:['pagi','malam'], catatan:'Dua kali sehari setengah tablet.', penting:false },
  { cat:'indo', variants:['1x½','1x1/2'], norm:'1x½', freqDay:1, dosePerTake:'½ tab', timing:['bebas'], catatan:'Sekali sehari setengah tablet.', penting:false },
  { cat:'indo', variants:['1x1 malam','1x1 nocte','sekali malam'], norm:'1x1 (malam)', freqDay:1, dosePerTake:'1 tab', timing:['malam'], catatan:'Sekali sehari khusus malam. Untuk statin, antihistamin.', penting:true },
  { cat:'indo', variants:['1x1 pagi','1x1 mane'], norm:'1x1 (pagi)', freqDay:1, dosePerTake:'1 tab', timing:['pagi'], catatan:'Sekali sehari khusus pagi. Untuk diuretik, levotiroksin.', penting:true },

  /* ── POLA X-Y-Z ── */
  { cat:'pola', variants:['1-1-1'], norm:'3x1 (pagi-siang-malam)', freqDay:3, dosePerTake:'1-1-1', timing:['pagi','siang','malam'], catatan:'Pagi 1, siang 1, malam 1. Setara 3x1 dengan jadwal jelas.', penting:true },
  { cat:'pola', variants:['1-0-1'], norm:'2x1 (pagi-malam)', freqDay:2, dosePerTake:'1-0-1', timing:['pagi','malam'], catatan:'Pagi 1, siang tidak, malam 1. BERBEDA dari 2x1 — eksplisit tidak ada siang.', penting:true },
  { cat:'pola', variants:['1-0-0'], norm:'1x1 (pagi)', freqDay:1, dosePerTake:'1-0-0', timing:['pagi'], catatan:'Pagi saja. Untuk diuretik, kortikosteroid.', penting:true },
  { cat:'pola', variants:['0-0-1'], norm:'1x1 (malam)', freqDay:1, dosePerTake:'0-0-1', timing:['malam'], catatan:'Malam saja. Untuk statin, hipnotik.', penting:true },
  { cat:'pola', variants:['1-1-0'], norm:'2x1 (pagi-siang)', freqDay:2, dosePerTake:'1-1-0', timing:['pagi','siang'], catatan:'Pagi dan siang saja, tidak malam. Untuk obat yang menyebabkan insomnia jika malam.', penting:true },
  { cat:'pola', variants:['0-1-1'], norm:'2x1 (siang-malam)', freqDay:2, dosePerTake:'0-1-1', timing:['siang','malam'], catatan:'Siang dan malam, tidak pagi.', penting:false },
  { cat:'pola', variants:['½-0-½','1/2-0-1/2'], norm:'2x½ (pagi-malam)', freqDay:2, dosePerTake:'½-0-½', timing:['pagi','malam'], catatan:'Setengah tablet pagi, tidak siang, setengah malam. Untuk titrasi dosis.', penting:true },
  { cat:'pola', variants:['1-0-½','1-0-1/2'], norm:'pagi 1, malam ½', freqDay:2, dosePerTake:'1-0-½', timing:['pagi','malam'], catatan:'Asimetris — pagi full dose, malam half dose. Contoh: warfarin, beberapa antihipertensi.', penting:true },
  { cat:'pola', variants:['2-1-2'], norm:'pagi 2, siang 1, malam 2', freqDay:3, dosePerTake:'2-1-2', timing:['pagi','siang','malam'], catatan:'Dosis tidak seragam. Perlu dicatat per waktu di label farmasi.', penting:false },
  { cat:'pola', variants:['1-1-1-1'], norm:'4x1', freqDay:4, dosePerTake:'1-1-1-1', timing:['pagi','siang','sore','malam'], catatan:'Empat kali sehari dengan pola eksplisit.', penting:false },

  /* ── PENULISAN BEBAS ── */
  { cat:'bebas', variants:['sekali sehari','once daily','once a day'], norm:'1x1', freqDay:1, dosePerTake:'1', timing:['bebas'], catatan:'Perlu klarifikasi waktu jika relevan.', penting:false },
  { cat:'bebas', variants:['dua kali sehari','twice daily','twice a day'], norm:'2x1', freqDay:2, dosePerTake:'1', timing:['pagi','malam'], catatan:'', penting:false },
  { cat:'bebas', variants:['tiga kali sehari','three times daily'], norm:'3x1', freqDay:3, dosePerTake:'1', timing:['pagi','siang','malam'], catatan:'', penting:false },
  { cat:'bebas', variants:['selang sehari','every other day','dua hari sekali'], norm:'q48h', freqDay:0.5, dosePerTake:'1', timing:['bebas'], catatan:'Setiap 2 hari. Untuk kortikosteroid jangka panjang atau beberapa obat reumatik.', penting:true },
  { cat:'bebas', variants:['seminggu sekali','once weekly','tiap minggu'], norm:'q1w', freqDay:0.14, dosePerTake:'1', timing:['bebas'], catatan:'Satu kali seminggu. Untuk metotreksat, bisfosfonat, suplemen tertentu.', penting:true },
  { cat:'bebas', variants:['sebulan sekali','once monthly'], norm:'q1mo', freqDay:0.03, dosePerTake:'1', timing:['bebas'], catatan:'Satu kali sebulan. Untuk bisfosfonat IV, beberapa kontrasepsi.', penting:false },
  { cat:'bebas', variants:['setiap ... jam','tiap ... jam'], norm:'qXh', freqDay:null, dosePerTake:'1', timing:['interval'], catatan:'Interval ketat. Nilai X harus diisi: q4h, q6h, q8h, q12h.', penting:true },
  { cat:'bebas', variants:['kalau nyeri','bila demam','jika sesak','sesuai kebutuhan'], norm:'prn (+ kondisi)', freqDay:0, dosePerTake:'1', timing:['prn'], catatan:'PRN dengan kondisi trigger. Sistem harus capture kondisi dan batas dosis.', penting:true },
  { cat:'bebas', variants:['loading dose lalu ...','dosis awal ... kemudian ...'], norm:'loading + maintenance', freqDay:null, dosePerTake:'var', timing:['stat+reguler'], catatan:'Dua fase: dosis awal lebih tinggi, lanjut dosis maintenance. Perlu dua baris di resep.', penting:true },
  { cat:'bebas', variants:['tappering','tapering off','turunkan bertahap'], norm:'tapering', freqDay:null, dosePerTake:'var', timing:['bertahap'], catatan:'Dosis diturunkan bertahap. Perlu jadwal per minggu di catatan resep.', penting:true },

  /* ── OBAT KHUSUS ── */
  { cat:'khusus', variants:['X IU malam','X unit/hari','sliding scale'], norm:'sesuai jadwal insulin', freqDay:null, dosePerTake:'var IU', timing:['malam','prn'], catatan:'Insulin basal: malam hari. Sliding scale: berdasarkan GDS. Perlu skema terpisah.', penting:true },
  { cat:'khusus', variants:['1 puff bd','2 puff tid','1 semprot ...'], norm:'X puff Xkali', freqDay:null, dosePerTake:'puff', timing:['bebas'], catatan:'Inhaler: dosis dalam puff/semprot, bukan tablet. Sertakan teknik inhalasi di catatan.', penting:true },
  { cat:'khusus', variants:['1 tetes OD bd','2 tetes OU tds','gtt OD/OS/OU'], norm:'X tetes OD/OS/OU', freqDay:null, dosePerTake:'tetes', timing:['bebas'], catatan:'OD=mata kanan, OS=mata kiri, OU=kedua mata. Gtt=guttae=tetes.', penting:true },
  { cat:'khusus', variants:['oleskan tipis','ue','usus externus','topical bd'], norm:'topikal Xkali', freqDay:null, dosePerTake:'tipis', timing:['bebas'], catatan:'Salep/krim: oleskan tipis di area yang sakit. ue = untuk pemakaian luar.', penting:false },
  { cat:'khusus', variants:['1 suppos rektal','1 suppositoria','supp k/p'], norm:'1 suppos rektal prn', freqDay:0, dosePerTake:'1 suppos', timing:['prn'], catatan:'Suppositoria rektal. Biasanya PRN untuk demam tinggi atau mual pasca operasi.', penting:false },
  { cat:'khusus', variants:['nebulisasi q4h','nebu tid'], norm:'nebulisasi Xkali', freqDay:null, dosePerTake:'1 nebulisasi', timing:['interval'], catatan:'Obat nebulisasi: frekuensi sama tapi rute berbeda. Perlu instruksi alat.', penting:false }
];

async function main() {
  console.log("==========================================");
  console.log("📝 SEEDING ATURAN PAKAI MASTER MAPPING 📝");
  console.log("==========================================");

  // Clear existing
  await prisma.master_aturan_pakai.deleteMany({});
  console.log("Cleared existing master_aturan_pakai records.");

  // Insert records
  let count = 0;
  for (const item of ATURAN_PAKAI_DATA) {
    await prisma.master_aturan_pakai.create({
      data: {
        kategori: item.cat,
        input_dokter: item.variants,
        format_standar: item.norm,
        frekuensi_hari: item.freqDay,
        dosis_per_minum: item.dosePerTake,
        waktu_minum: item.timing,
        catatan_implementasi: item.catatan,
        is_penting: item.penting
      }
    });
    count++;
  }

  console.log(`\n🎉 Successfully seeded ${count} master_aturan_pakai clinical records into PostgreSQL!`);
  process.exit(0);
}

main().catch(err => {
  console.error("❌ ERROR SEEDING ATURAN PAKAI:", err);
  process.exit(1);
});
