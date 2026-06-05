require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding rich test patients with complete histories...');

  const allObats = await prisma.master_obat_produk.findMany();
  if (allObats.length === 0) {
    throw new Error("No medicines found in database. Run seed-obat.js first!");
  }
  const obatMap = {
    'OBT-001': allObats[0]?.id,
    'OBT-002': allObats[1]?.id || allObats[0]?.id,
    'OBT-003': allObats[2]?.id || allObats[0]?.id,
    'OBT-004': allObats[3]?.id || allObats[0]?.id,
    'OBT-005': allObats[4]?.id || allObats[0]?.id,
    'OBT-006': allObats[0]?.id,
    'OBT-007': allObats[1]?.id || allObats[0]?.id,
    'OBT-008': allObats[2]?.id || allObats[0]?.id,
  };

  // Delete previous test patient records to avoid duplicate NIK/no_rm constraint errors
  const testRms = ['RM-HNZ-TEST01', 'RM-HNZ-TEST02', 'RM-HNZ-TEST03'];
  for (const rm of testRms) {
    const existing = await prisma.pasien.findUnique({ where: { no_rm: rm } });
    if (existing) {
      console.log(`Clearing existing test patient: ${rm}`);
      await prisma.pasien.delete({ where: { id_pasien: existing.id_pasien } });
    }
  }

  const today = new Date();

  // ==========================================
  // --- PATIENT 1: BUDI SANTOSO (1 Previous Visit - Active in Doctor Queue) ---
  // ==========================================
  console.log('Creating Patient 1: Budi Santoso (1 previous visit)...');
  const patient1 = await prisma.pasien.create({
    data: {
      no_rm: 'RM-HNZ-TEST01',
      nik: '1234567890123456',
      nama_lengkap: 'Budi Santoso',
      tgl_lahir: new Date('1985-04-12'),
      jenis_kelamin: 'L',
      agama: 'Islam',
      pekerjaan: 'Wiraswasta',
      no_kontak: '081234567890',
      alamat_lengkap: 'Jl. Merdeka No. 45, Jakarta',
    }
  });

  // History Visit 1: 10 Days ago
  const v1Date = new Date();
  v1Date.setDate(v1Date.getDate() - 10);
  const visit1_v1 = await prisma.kunjungan.create({
    data: {
      id_pasien: patient1.id_pasien,
      tgl_kunjungan: v1Date,
      status_kunjungan: 'Selesai',
      no_kunjungan: 'K-HNZ-10001',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit1_v1.id_kunjungan,
      keluhan_utama: 'Batuk berdahak dan pilek sejak 3 hari lalu',
      sistole: 120,
      diastole: 80,
      suhu_tubuh: 37.2,
      berat_badan: 72.0,
      tinggi_badan: 170.0,
      detak_jantung: 84,
      respiratory_rate: 18,
      alergi_makanan: 'Udang',
      alergi_obat: 'Tidak ada',
      skala_nyeri: 2,
      skala_risiko_jatuh: 10,
      tingkat_risiko_jatuh: 'Risiko Rendah',
      riwayat_penyakit: 'Hipertensi Ringan',
      obat_dikonsumsi: 'Paracetamol',
      spo2: 98,
      gds: 110,
    }
  });

  await prisma.pemeriksaan_dokter.create({
    data: {
      id_kunjungan: visit1_v1.id_kunjungan,
      anamnesis_subjektif: 'Pasien mengeluhkan demam sumeng-sumeng, pilek, batuk produktif berdahak putih keabuan. Tenggorokan terasa gatal.',
      pemeriksaan_fisik_objektif: {
        diagnosa_utama: 'Acute Nasopharyngitis (Common Cold)',
        icd10_utama: 'J00',
        rencana_tindakan: 'Edukasi istirahat cukup, banyak minum air hangat.',
        edukasi_pasien: 'Hindari gorengan dan minuman dingin selama 3 hari.',
      },
      rencana_terapi_plan: 'Edukasi istirahat cukup, banyak minum air putih hangat. Hindari gorengan dan es.',
    }
  });

  const resep1_v1 = await prisma.resep.create({
    data: {
      id_kunjungan: visit1_v1.id_kunjungan,
      no_resep: 'RSP-TEST01-V1',
      status_resep: 'Selesai',
    }
  });

  await prisma.resep_item.createMany({
    data: [
      { id_resep: resep1_v1.id_resep, id_obat: obatMap['OBT-007'], jumlah: 10, aturan_pakai: '3x1 sehari', catatan_tambahan: 'Sesudah makan, dihabiskan' },
      { id_resep: resep1_v1.id_resep, id_obat: obatMap['OBT-006'], jumlah: 10, aturan_pakai: '3x1 sehari', catatan_tambahan: 'Sesudah makan, jika demam' },
    ]
  });

  // Current Active Visit (Today - already triaged, waiting for doctor)
  const visit1_today = await prisma.kunjungan.create({
    data: {
      id_pasien: patient1.id_pasien,
      tgl_kunjungan: today,
      status_kunjungan: 'Menunggu',
      no_kunjungan: 'K-HNZ-10050',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit1_today.id_kunjungan,
      keluhan_utama: 'Kontrol batuk pilek kemarin, tenggorokan masih terasa sedikit gatal',
      sistole: 118,
      diastole: 78,
      suhu_tubuh: 36.6,
      berat_badan: 71.5,
      tinggi_badan: 170.0,
      detak_jantung: 80,
      respiratory_rate: 16,
      alergi_makanan: 'Udang',
      alergi_obat: 'Tidak ada',
      skala_nyeri: 1,
      skala_risiko_jatuh: 0,
      tingkat_risiko_jatuh: 'Aman',
      riwayat_penyakit: 'Hipertensi Ringan',
      obat_dikonsumsi: 'Paracetamol',
      spo2: 99,
      gds: 105,
    }
  });

  await prisma.antrean.create({
    data: {
      no_antrean: 'A-050',
      tipe_antrean: 'Poli',
      status_panggil: 'Menunggu',
      id_kunjungan: visit1_today.id_kunjungan,
      created_at: today,
    }
  });


  // ==========================================
  // --- PATIENT 2: SUSI SUSANTI (3 Previous Visits - Active in Doctor Queue) ---
  // ==========================================
  console.log('Creating Patient 2: Susi Susanti (3 previous visits)...');
  const patient2 = await prisma.pasien.create({
    data: {
      no_rm: 'RM-HNZ-TEST02',
      nik: '9876543210123456',
      nama_lengkap: 'Susi Susanti',
      tgl_lahir: new Date('1972-11-20'),
      jenis_kelamin: 'P',
      agama: 'Kristen',
      pekerjaan: 'Ibu Rumah Tangga',
      no_kontak: '085678901234',
      alamat_lengkap: 'Jl. Melati Raya No. 12, Bandung',
    }
  });

  // History Visit 1: 3 Months ago
  const date_v1 = new Date();
  date_v1.setMonth(date_v1.getMonth() - 3);
  const visit2_v1 = await prisma.kunjungan.create({
    data: {
      id_pasien: patient2.id_pasien,
      tgl_kunjungan: date_v1,
      status_kunjungan: 'Selesai',
      no_kunjungan: 'K-HNZ-09901',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit2_v1.id_kunjungan,
      keluhan_utama: 'Sakit kepala berdenyut bagian tengkuk, leher kaku',
      sistole: 155,
      diastole: 98,
      suhu_tubuh: 36.8,
      berat_badan: 68.0,
      tinggi_badan: 158.0,
      detak_jantung: 92,
      respiratory_rate: 20,
      alergi_makanan: 'Kacang',
      alergi_obat: 'Captopril',
      skala_nyeri: 4,
      skala_risiko_jatuh: 25,
      tingkat_risiko_jatuh: 'Risiko Sedang',
      riwayat_penyakit: 'Hipertensi Kronis, Diabetes Melitus',
      obat_dikonsumsi: 'Metformin',
      spo2: 97,
      gds: 165,
    }
  });

  await prisma.pemeriksaan_dokter.create({
    data: {
      id_kunjungan: visit2_v1.id_kunjungan,
      anamnesis_subjektif: 'Pasien datang kontrol rutin bulanan. Mengeluhkan pusing kencang di bagian tengkuk leher belakang sejak 3 hari terakhir.',
      pemeriksaan_fisik_objektif: {
        diagnosa_utama: 'Essential (primary) hypertension',
        icd10_utama: 'I10',
        rencana_tindakan: 'Amlodipine 5mg 1x1 malam. Metformin 500mg 2x1.',
        edukasi_pasien: 'Pertahankan kepatuhan minum obat pagi/malam. Batasi garam.',
      },
      rencana_terapi_plan: 'Pertahankan kepatuhan minum obat pagi/malam. Batasi garam dan makanan berkolesterol tinggi.',
    }
  });

  const resep2_v1 = await prisma.resep.create({
    data: {
      id_kunjungan: visit2_v1.id_kunjungan,
      no_resep: 'RSP-TEST02-V1',
      status_resep: 'Selesai',
    }
  });

  await prisma.resep_item.createMany({
    data: [
      { id_resep: resep2_v1.id_resep, id_obat: obatMap['OBT-002'], jumlah: 30, aturan_pakai: '1x1 sehari', catatan_tambahan: 'Malam hari' },
      { id_resep: resep2_v1.id_resep, id_obat: obatMap['OBT-001'], jumlah: 60, aturan_pakai: '2x1 sehari', catatan_tambahan: 'Sesudah makan' },
    ]
  });

  // History Visit 2: 2 Months ago
  const date_v2 = new Date();
  date_v2.setMonth(date_v2.getMonth() - 2);
  const visit2_v2 = await prisma.kunjungan.create({
    data: {
      id_pasien: patient2.id_pasien,
      tgl_kunjungan: date_v2,
      status_kunjungan: 'Selesai',
      no_kunjungan: 'K-HNZ-09950',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit2_v2.id_kunjungan,
      keluhan_utama: 'Pusing berkurang, badan sering lemas di pagi hari',
      sistole: 145,
      diastole: 90,
      suhu_tubuh: 36.5,
      berat_badan: 67.5,
      tinggi_badan: 158.0,
      detak_jantung: 88,
      respiratory_rate: 18,
      alergi_makanan: 'Kacang',
      alergi_obat: 'Captopril',
      skala_nyeri: 2,
      skala_risiko_jatuh: 0,
      tingkat_risiko_jatuh: 'Aman',
      riwayat_penyakit: 'Hipertensi Kronis, Diabetes Melitus',
      obat_dikonsumsi: 'Amlodipine, Metformin',
      spo2: 98,
      gds: 152,
    }
  });

  await prisma.pemeriksaan_dokter.create({
    data: {
      id_kunjungan: visit2_v2.id_kunjungan,
      anamnesis_subjektif: 'Evaluasi pengobatan hipertensi and DM. Pusing tengkuk mereda, namun mengeluhkan mudah lemas di pagi hari.',
      pemeriksaan_fisik_objektif: {
        diagnosa_utama: 'Non-insulin-dependent diabetes mellitus without complications',
        icd10_utama: 'E11.9',
        rencana_tindakan: 'Lanjutkan regimen Amlodipine 5mg & Metformin 500mg.',
        edukasi_pasien: 'Pantau gula darah mandiri berkala.',
      },
      rencana_terapi_plan: 'Edukasi pemantauan gula darah berkala dan rutin beraktivitas fisik sedang 30 menit per hari.',
    }
  });

  const resep2_v2 = await prisma.resep.create({
    data: {
      id_kunjungan: visit2_v2.id_kunjungan,
      no_resep: 'RSP-TEST02-V2',
      status_resep: 'Selesai',
    }
  });

  await prisma.resep_item.createMany({
    data: [
      { id_resep: resep2_v2.id_resep, id_obat: obatMap['OBT-002'], jumlah: 30, aturan_pakai: '1x1 sehari', catatan_tambahan: 'Malam hari' },
      { id_resep: resep2_v2.id_resep, id_obat: obatMap['OBT-001'], jumlah: 60, aturan_pakai: '2x1 sehari', catatan_tambahan: 'Sesudah makan' },
    ]
  });

  // History Visit 3: 1 Month ago
  const date_v3 = new Date();
  date_v3.setMonth(date_v3.getMonth() - 1);
  const visit2_v3 = await prisma.kunjungan.create({
    data: {
      id_pasien: patient2.id_pasien,
      tgl_kunjungan: date_v3,
      status_kunjungan: 'Selesai',
      no_kunjungan: 'K-HNZ-10012',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit2_v3.id_kunjungan,
      keluhan_utama: 'Kontrol hipertensi bulanan, keluhan pusing sudah minimal',
      sistole: 135,
      diastole: 85,
      suhu_tubuh: 36.4,
      berat_badan: 67.0,
      tinggi_badan: 158.0,
      detak_jantung: 82,
      respiratory_rate: 17,
      alergi_makanan: 'Kacang',
      alergi_obat: 'Captopril',
      skala_nyeri: 1,
      skala_risiko_jatuh: 0,
      tingkat_risiko_jatuh: 'Aman',
      riwayat_penyakit: 'Hipertensi Kronis, Diabetes Melitus',
      obat_dikonsumsi: 'Amlodipine, Metformin',
      spo2: 98,
      gds: 138,
    }
  });

  await prisma.pemeriksaan_dokter.create({
    data: {
      id_kunjungan: visit2_v3.id_kunjungan,
      anamnesis_subjektif: 'Pasien merasa jauh lebih segar. Tekanan darah mulai terkontrol baik dengan Amlodipine 5mg.',
      pemeriksaan_fisik_objektif: {
        diagnosa_utama: 'Essential (primary) hypertension',
        icd10_utama: 'I10',
        rencana_tindakan: 'Lanjutkan regimen Amlodipine 5mg & Metformin 500mg.',
        edukasi_pasien: 'Lanjutkan pola makan rendah garam.',
      },
      rencana_terapi_plan: 'Terapi obat dilanjutkan. Jadwalkan kontrol ulang 1 bulan kemudian.',
    }
  });

  const resep2_v3 = await prisma.resep.create({
    data: {
      id_kunjungan: visit2_v3.id_kunjungan,
      no_resep: 'RSP-TEST02-V3',
      status_resep: 'Selesai',
    }
  });

  await prisma.resep_item.createMany({
    data: [
      { id_resep: resep2_v3.id_resep, id_obat: obatMap['OBT-002'], jumlah: 30, aturan_pakai: '1x1 sehari', catatan_tambahan: 'Malam hari' },
      { id_resep: resep2_v3.id_resep, id_obat: obatMap['OBT-001'], jumlah: 60, aturan_pakai: '2x1 sehari', catatan_tambahan: 'Sesudah makan' },
    ]
  });

  // Current Active Visit (Today - already triaged, waiting for doctor)
  const visit2_today = await prisma.kunjungan.create({
    data: {
      id_pasien: patient2.id_pasien,
      tgl_kunjungan: today,
      status_kunjungan: 'Menunggu',
      no_kunjungan: 'K-HNZ-10051',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit2_today.id_kunjungan,
      keluhan_utama: 'Keluhan pusing tengkuk muncul kembali sejak kemarin malam akibat kelelahan',
      sistole: 148,
      diastole: 94,
      suhu_tubuh: 36.7,
      berat_badan: 67.0,
      tinggi_badan: 158.0,
      detak_jantung: 86,
      respiratory_rate: 19,
      alergi_makanan: 'Kacang',
      alergi_obat: 'Captopril',
      skala_nyeri: 3,
      skala_risiko_jatuh: 25,
      tingkat_risiko_jatuh: 'Risiko Sedang',
      riwayat_penyakit: 'Hipertensi Kronis, Diabetes Melitus',
      obat_dikonsumsi: 'Amlodipine, Metformin',
      spo2: 98,
      gds: 148,
    }
  });

  await prisma.antrean.create({
    data: {
      no_antrean: 'A-051',
      tipe_antrean: 'Poli',
      status_panggil: 'Menunggu',
      id_kunjungan: visit2_today.id_kunjungan,
      created_at: today,
    }
  });


  // ==========================================
  // --- PATIENT 3: JOKO SUSILO (2 Previous Visits - Active in Nurse Queue) ---
  // ==========================================
  console.log('Creating Patient 3: Joko Susilo (2 previous visits - waiting in Nurse queue)...');
  const patient3 = await prisma.pasien.create({
    data: {
      no_rm: 'RM-HNZ-TEST03',
      nik: '1122334455667788',
      nama_lengkap: 'Joko Susilo',
      tgl_lahir: new Date('1990-08-25'),
      jenis_kelamin: 'L',
      agama: 'Islam',
      pekerjaan: 'PNS',
      no_kontak: '081399887766',
      alamat_lengkap: 'Jl. Diponegoro No. 88, Semarang',
    }
  });

  // History Visit 1: 2 Months ago
  const date3_v1 = new Date();
  date3_v1.setMonth(date3_v1.getMonth() - 2);
  const visit3_v1 = await prisma.kunjungan.create({
    data: {
      id_pasien: patient3.id_pasien,
      tgl_kunjungan: date3_v1,
      status_kunjungan: 'Selesai',
      no_kunjungan: 'K-HNZ-09855',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit3_v1.id_kunjungan,
      keluhan_utama: 'Nyeri ulu hati, mual, dan muntah 2x',
      sistole: 115,
      diastole: 75,
      suhu_tubuh: 37.0,
      berat_badan: 65.0,
      tinggi_badan: 168.0,
      detak_jantung: 82,
      respiratory_rate: 18,
      alergi_makanan: 'Seafood',
      alergi_obat: 'Tidak ada',
      skala_nyeri: 5,
      skala_risiko_jatuh: 0,
      tingkat_risiko_jatuh: 'Aman',
      riwayat_penyakit: 'Gastritis Kronis',
      obat_dikonsumsi: 'Antasida',
      spo2: 98,
      gds: 95,
    }
  });

  await prisma.pemeriksaan_dokter.create({
    data: {
      id_kunjungan: visit3_v1.id_kunjungan,
      anamnesis_subjektif: 'Nyeri ulu hati terasa perih seperti terbakar, mual, muntah cairan asam 2 kali tadi pagi. Nafsu makan menurun.',
      pemeriksaan_fisik_objektif: {
        diagnosa_utama: 'Gastritis, unspecified',
        icd10_utama: 'K29.7',
        rencana_tindakan: 'Omeprazole 20mg 1x1 30 menit sebelum sarapan.',
        edukasi_pasien: 'Makan teratur porsi kecil tapi sering. Hindari pedas.',
      },
      rencana_terapi_plan: 'Makan teratur porsi kecil tapi sering. Hindari makanan pedas, asam, dan kopi.',
    }
  });

  const resep3_v1 = await prisma.resep.create({
    data: {
      id_kunjungan: visit3_v1.id_kunjungan,
      no_resep: 'RSP-TEST03-V1',
      status_resep: 'Selesai',
    }
  });

  await prisma.resep_item.createMany({
    data: [
      { id_resep: resep3_v1.id_resep, id_obat: obatMap['OBT-008'], jumlah: 10, aturan_pakai: '1x1 sehari', catatan_tambahan: 'Sebelum makan pagi' },
      { id_resep: resep3_v1.id_resep, id_obat: obatMap['OBT-006'], jumlah: 10, aturan_pakai: '3x1 sehari', catatan_tambahan: 'Bila nyeri/demam' },
    ]
  });

  // History Visit 2: 1 Month ago
  const date3_v2 = new Date();
  date3_v2.setMonth(date3_v2.getMonth() - 1);
  const visit3_v2 = await prisma.kunjungan.create({
    data: {
      id_pasien: patient3.id_pasien,
      tgl_kunjungan: date3_v2,
      status_kunjungan: 'Selesai',
      no_kunjungan: 'K-HNZ-09977',
    }
  });

  await prisma.asesmen_keperawatan.create({
    data: {
      id_kunjungan: visit3_v2.id_kunjungan,
      keluhan_utama: 'Kontrol gastritis, nyeri ulu hati berkurang jauh',
      sistole: 118,
      diastole: 78,
      suhu_tubuh: 36.5,
      berat_badan: 65.5,
      tinggi_badan: 168.0,
      detak_jantung: 78,
      respiratory_rate: 16,
      alergi_makanan: 'Seafood',
      alergi_obat: 'Tidak ada',
      skala_nyeri: 1,
      skala_risiko_jatuh: 0,
      tingkat_risiko_jatuh: 'Aman',
      riwayat_penyakit: 'Gastritis Kronis',
      obat_dikonsumsi: 'Omeprazole',
      spo2: 99,
      gds: 98,
    }
  });

  await prisma.pemeriksaan_dokter.create({
    data: {
      id_kunjungan: visit3_v2.id_kunjungan,
      anamnesis_subjektif: 'Evaluasi terapi gastritis. Nyeri ulu hati membaik, keluhan mual/muntah sudah hilang.',
      pemeriksaan_fisik_objektif: {
        diagnosa_utama: 'Gastritis, unspecified',
        icd10_utama: 'K29.7',
        rencana_tindakan: 'Lanjutkan Omeprazole 5 hari lagi.',
        edukasi_pasien: 'Pertahankan pola makan sehat.',
      },
      rencana_terapi_plan: 'Regimen Omeprazole dihentikan, pertahankan pola makan sehat.',
    }
  });

  const resep3_v2 = await prisma.resep.create({
    data: {
      id_kunjungan: visit3_v2.id_kunjungan,
      no_resep: 'RSP-TEST03-V2',
      status_resep: 'Selesai',
    }
  });

  await prisma.resep_item.createMany({
    data: [
      { id_resep: resep3_v2.id_resep, id_obat: obatMap['OBT-008'], jumlah: 5, aturan_pakai: '1x1 sehari', catatan_tambahan: 'Sebelum makan' },
    ]
  });

  // Current Active Visit (Today - NOT triaged yet, waiting for perawat triage!)
  const visit3_today = await prisma.kunjungan.create({
    data: {
      id_pasien: patient3.id_pasien,
      tgl_kunjungan: today,
      status_kunjungan: 'Menunggu',
      no_kunjungan: 'K-HNZ-10052',
    }
  });

  // Note: NO asesmen_keperawatan created for today yet! So perawat can input it!

  // Active in Nurse queue
  await prisma.antrean.create({
    data: {
      no_antrean: 'N-010',
      tipe_antrean: 'Nurse',
      status_panggil: 'Menunggu',
      id_kunjungan: visit3_today.id_kunjungan,
      created_at: today,
    }
  });

  console.log('✅ Seeding rich test patients completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during test patients seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
