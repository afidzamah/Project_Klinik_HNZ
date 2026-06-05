require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("====================================================");
  console.log("🚀 SEEDING ENCOUNTER DATA SITI AMINAH (Hipertensi) 🚀");
  console.log("====================================================");

  // 1. Get or Create active substance Amlodipine
  let amloSub = await prisma.master_obat_zat_aktif.findFirst({
    where: { nama_generik: { contains: "Amlodipine" } }
  });

  if (!amloSub) {
    console.log("Active substance Amlodipine not found. Creating it...");
    amloSub = await prisma.master_obat_zat_aktif.create({
      data: {
        nama_generik: "Amlodipine Besylate",
        nama_alias: ["Amlodipine", "Norvask"],
        kode_atc: "C08CA01",
        kelas_terapi: "Antihipertensi",
        subkelas_terapi: "Calcium Channel Blocker (CCB)",
        golongan_obat: "Keras",
        dosis_lazim_dewasa: "5mg - 10mg tiap 24 jam",
        dosis_lazim_anak: "2.5mg - 5mg tiap 24 jam",
        dosis_max_harian: 10,
        perlu_penyesuaian_ginjal: false,
        perlu_penyesuaian_hepar: true,
        kontraindikasi_kehamilan: "C",
        frekuensi_default: "1x1",
        waktu_minum_default: "pc",
        is_formularium_nas: true
      }
    });
  }
  console.log(`✓ Active substance: ${amloSub.nama_generik} (ID: ${amloSub.id})`);

  // 2. Create/find general Warehouse (Apotek)
  let apotekGudang = await prisma.master_gudang.findFirst({
    where: { nama_gudang: { contains: "Apotek" } }
  });
  if (!apotekGudang) {
    apotekGudang = await prisma.master_gudang.create({
      data: { nama_gudang: "Apotek Rawat Jalan Utama" }
    });
  }
  console.log(`✓ Warehouse: ${apotekGudang.nama_gudang} (ID: ${apotekGudang.id_gudang})`);

  // 3. Clear existing Amlodipine 10mg products to ensure clean seed
  console.log("Cleaning old Amlodipine 10mg products...");
  const oldProds = await prisma.master_obat_produk.findMany({
    where: { 
      zat_aktif_id: amloSub.id,
      kekuatan_dosis: "10mg"
    }
  });
  for (const op of oldProds) {
    await prisma.obat_stok.deleteMany({ where: { produk_id: op.id } });
    await prisma.obat_harga.deleteMany({ where: { produk_id: op.id } });
  }
  await prisma.master_obat_produk.deleteMany({
    where: { 
      zat_aktif_id: amloSub.id,
      kekuatan_dosis: "10mg"
    }
  });

  // 4. Create the 4 candidate products for Amlodipine 10mg
  console.log("Seeding 4 candidate products for Amlodipine 10mg...");
  
  // A. Amlodipine 10mg Generik — BPJS = true, Formularium = true
  const prodGen = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: amloSub.id,
      nama_dagang: "Amlodipine",
      nama_produk_lengkap: "Amlodipine 10mg Generik",
      kekuatan_dosis: "10mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 10,
      produsen: "Kimia Farma",
      no_registrasi_bpom: "GKL123456789A1",
      tipe_produk: "generik",
      is_bpjs: true,
      is_formularium_rs: true,
      prioritas_substitusi: 1
    }
  });
  await prisma.obat_stok.create({
    data: {
      produk_id: prodGen.id,
      gudang_id: apotekGudang.id_gudang,
      stok_tersedia: 284,
      stok_minimum: 50,
      no_batch: "BCH-AML-GEN",
      expired_date: new Date("2028-12-31")
    }
  });

  // B. Amlodipine 10mg Kimfa — BPJS = true, Formularium = true
  const prodKim = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: amloSub.id,
      nama_dagang: "Amlodipine Kimfa",
      nama_produk_lengkap: "Amlodipine 10mg Kimfa",
      kekuatan_dosis: "10mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 10,
      produsen: "Kimia Farma",
      no_registrasi_bpom: "GKL987654321B2",
      tipe_produk: "generik",
      is_bpjs: true,
      is_formularium_rs: true,
      prioritas_substitusi: 2
    }
  });
  await prisma.obat_stok.create({
    data: {
      produk_id: prodKim.id,
      gudang_id: apotekGudang.id_gudang,
      stok_tersedia: 150,
      stok_minimum: 30,
      no_batch: "BCH-AML-KIM",
      expired_date: new Date("2028-10-30")
    }
  });

  // C. Amlodipine 10mg Dexa — BPJS = true, Formularium = false
  const prodDex = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: amloSub.id,
      nama_dagang: "Amlodipine Dexa",
      nama_produk_lengkap: "Amlodipine 10mg Dexa",
      kekuatan_dosis: "10mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 10,
      produsen: "Dexa Medica",
      no_registrasi_bpom: "GKL456789123C3",
      tipe_produk: "generik",
      is_bpjs: true,
      is_formularium_rs: false,
      prioritas_substitusi: 3
    }
  });
  await prisma.obat_stok.create({
    data: {
      produk_id: prodDex.id,
      gudang_id: apotekGudang.id_gudang,
      stok_tersedia: 320,
      stok_minimum: 40,
      no_batch: "BCH-AML-DEX",
      expired_date: new Date("2028-08-15")
    }
  });

  // D. Norvasc 10mg Pfizer — BPJS = false, Formularium = false
  const prodNor = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: amloSub.id,
      nama_dagang: "Norvasc",
      nama_produk_lengkap: "Norvasc 10mg Pfizer",
      kekuatan_dosis: "10mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 30,
      produsen: "Pfizer Indonesia",
      no_registrasi_bpom: "DKI7222201201D1",
      tipe_produk: "paten",
      is_bpjs: false,
      is_formularium_rs: false,
      prioritas_substitusi: 4
    }
  });
  await prisma.obat_stok.create({
    data: {
      produk_id: prodNor.id,
      gudang_id: apotekGudang.id_gudang,
      stok_tersedia: 80,
      stok_minimum: 10,
      no_batch: "BCH-AML-PFIZ",
      expired_date: new Date("2029-01-20")
    }
  });
  console.log("✓ Candidates successfully seeded with stocks.");

  // 5. Seed Patient: Siti Aminah (BPJS)
  console.log("Seeding Patient Siti Aminah...");
  let siti = await prisma.pasien.findFirst({
    where: { nik: "3171012345670001" }
  });
  
  if (siti) {
    console.log("Found existing patient Siti Aminah, cleaning her clinical visit history...");
    const visits = await prisma.kunjungan.findMany({ where: { id_pasien: siti.id_pasien } });
    for (const v of visits) {
      await prisma.antrean.deleteMany({ where: { id_kunjungan: v.id_kunjungan } });
      await prisma.asesmen_keperawatan.deleteMany({ where: { id_kunjungan: v.id_kunjungan } });
      await prisma.pemeriksaan_dokter.deleteMany({ where: { id_kunjungan: v.id_kunjungan } });
      
      const prescriptions = await prisma.resep.findMany({ where: { id_kunjungan: v.id_kunjungan } });
      for (const rx of prescriptions) {
        await prisma.resep_item.deleteMany({ where: { id_resep: rx.id_resep } });
      }
      await prisma.resep.deleteMany({ where: { id_kunjungan: v.id_kunjungan } });
    }
    await prisma.kunjungan.deleteMany({ where: { id_pasien: siti.id_pasien } });
  } else {
    siti = await prisma.pasien.create({
      data: {
        no_rm: "RM-9921",
        nama_lengkap: "Siti Aminah",
        nik: "3171012345670001",
        tgl_lahir: new Date("1970-05-28"), // age 56
        jenis_kelamin: "P",
        no_kontak: "081234567890",
        alamat_lengkap: "Jl. Margonda Raya No. 45, Depok"
      }
    });
  }
  console.log(`✓ Patient: ${siti.nama_lengkap} (No RM: ${siti.no_rm})`);

  // 6. Find master BPJS codes
  const cbBPJS = await prisma.master_cara_bayar.findFirst({ where: { nama_cara_bayar: 'BPJS' } });
  const penBPJS = await prisma.master_penjamin.findFirst({ where: { nama_penjamin: { contains: 'BPJS' } } });

  // 7. Create active Kunjungan
  const kunjungan = await prisma.kunjungan.create({
    data: {
      id_pasien: siti.id_pasien,
      id_cara_bayar: cbBPJS ? cbBPJS.id_cara_bayar : null,
      id_penjamin: penBPJS ? penBPJS.id_penjamin : null,
      status_kunjungan: "Pemeriksaan",
      tgl_kunjungan: new Date()
    }
  });
  console.log(`✓ Clinical Visit created (ID: ${kunjungan.id_kunjungan})`);

  // 8. Create Antrean (Doctor Queue)
  const antrean = await prisma.antrean.create({
    data: {
      no_antrean: "A-012",
      tipe_antrean: "Poli",
      status_panggil: "Panggil",
      kunjungan: { connect: { id_kunjungan: kunjungan.id_kunjungan } },
      created_at: new Date()
    }
  });
  console.log(`✓ Doctor Calling Queue created (No: ${antrean.no_antrean})`);

  // 9. Create Nurse Triage Assessment (Asesmen Keperawatan)
  const triage = await prisma.asesmen_keperawatan.create({
    data: {
      kunjungan: { connect: { id_kunjungan: kunjungan.id_kunjungan } },
      keluhan_utama: "Kontrol rutin Hipertensi bulanan. Mengeluh sering pusing ringan dan tegang di tengkuk.",
      sistole: 150,
      diastole: 90,
      suhu_tubuh: 36.6,
      detak_jantung: 80,
      berat_badan: 54,
      alergi_obat: "Golongan Penisilin"
    }
  });
  console.log("✓ Nurse Triage Assessment logged successfully.");

  // 10. Auto-compile the compiled E-Prescription transcript into plans
  const rencanaTerapiPlan = `Rencana Terapi Bulanan:
- Edukasi diet rendah garam dan hindari makanan tinggi lemak.
- Kontrol tekanan darah secara mandini di rumah.
- Naikkan dosis Amlodipine dari 5mg menjadi 10mg sekali sehari.
- Jadwalkan kontrol ulang 30 hari lagi.

=== RESEP DIGITAL DIGITAL ===
R/ Amlodipine 10mg Generik - 30 unit
Aturan Pakai: 1x1 setelah makan (oral)
Catatan: naik dosis dari 5mg

R/ Puyer Racikan (Puyer / Serbuk — 10 unit)
Aturan Pakai: 3x1 bungkus Setelah makan (Larutkan dalam air)
BB Pasien: 24 kg
Dosis Pemberian: 1 unit

Bahan:
1. Amoxicillin 125 mg -> Total: 1.250 mg
2. Paracetamol 150 mg -> Total: 1.500 mg
3. Cetirizine 2.5 mg -> Total: 25 mg
4. Lactosa (pengisi) [qs] -> Total: qs (auto)

Instruksi:
Haluskan hingga homogen. Bungkus dalam kertas puyer.`;

  // Create Doctor SOAP Examination
  const soap = await prisma.pemeriksaan_dokter.create({
    data: {
      kunjungan: { connect: { id_kunjungan: kunjungan.id_kunjungan } },
      anamnesis_subjektif: "Pasien Siti Aminah kontrol rutin Hipertensi. Mengeluh tegang di tengkuk dan pusing ringan. Riwayat minum Amlodipine 5mg teratur namun tensi masih sering di atas 140.",
      pemeriksaan_fisik_objektif: {
        diagnosa_utama: "Essential (primary) hypertension (I10)",
        icd10_utama: "I10"
      },
      rencana_terapi_plan: rencanaTerapiPlan
    }
  });
  console.log("✓ Doctor SOAP EMR note locked & saved.");

  // 11. Create E-Prescription record
  const rx = await prisma.resep.create({
    data: {
      kunjungan: { connect: { id_kunjungan: kunjungan.id_kunjungan } },
      no_resep: `R-HNZ-SITI`,
      status_resep: "Terkirim"
    }
  });

  // Link to the Amlodipine 10mg Generik product seeded earlier
  const rxItem = await prisma.resep_item.create({
    data: {
      resep: { connect: { id_resep: rx.id_resep } },
      master_obat: { connect: { id: prodGen.id } }, // Mapped generic product
      jumlah: 30,
      aturan_pakai: "1x1 setelah makan",
      catatan_tambahan: "naik dosis dari 5mg"
    }
  });
  
  // Add compounded sediaan to demonstrate BOTH in the pharmacist verification dashboard
  const rxComp = await prisma.resep_item.create({
    data: {
      resep: { connect: { id_resep: rx.id_resep } },
      jumlah: 10,
      aturan_pakai: "3x1 bungkus Setelah makan (Larutkan dalam air)",
      catatan_tambahan: "BB: 24kg. Puyer 10 bungkus.\nBahan:\n1. Amox 125mg -> 1.250mg\n2. PCT 150mg -> 1.500mg\n3. Cetirizine 2.5mg -> 25mg\n4. Lactosa qs\nInstruksi: Gerus homogen, bagi 10."
    }
  });

  console.log("✓ Structured Digital Prescription locked and sent to Apothecary queue.");
  console.log("====================================================");
  console.log("🎉 SUCCESS! Siti Aminah (BPJS) has been successfully seeded.");
  console.log("She is now waiting in the Active Apothecary queue for verification!");
  console.log("====================================================");
}

main()
  .catch((e) => {
    console.error("🔴 Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
