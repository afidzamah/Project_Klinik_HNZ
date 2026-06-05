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
  console.log("💊 STARTING SEEDING MASTER OBAT & SAFEY CHECK DATA 💊");
  console.log("====================================================");

  // Clear existing records in proper reverse-relational order
  console.log("Clearing existing medicine data...");
  await prisma.obat_interaksi.deleteMany({});
  await prisma.obat_harga.deleteMany({});
  await prisma.obat_stok.deleteMany({});
  await prisma.master_gudang.deleteMany({});
  await prisma.master_obat_produk.deleteMany({});
  await prisma.master_obat_zat_aktif.deleteMany({});
  console.log("Cleanup completed.");

  // 1. Seed Active Substances (Zat Aktif)
  console.log("\nSeeding Master Obat Zat Aktif...");
  
  const amox = await prisma.master_obat_zat_aktif.create({
    data: {
      nama_generik: "Amoxicillin",
      nama_alias: ["Amox", "Amoxicilina", "Amoxil"],
      kode_atc: "J01CA04",
      kelas_terapi: "Antibiotik",
      subkelas_terapi: "Beta-Lactam Penicillin",
      golongan_obat: "Keras",
      dosis_lazim_dewasa: "250mg - 500mg tiap 8 jam",
      dosis_lazim_anak: "20 - 40mg/kgBB/hari dibagi tiap 8 jam",
      dosis_max_harian: 3000,
      perlu_penyesuaian_ginjal: true,
      perlu_penyesuaian_hepar: false,
      kontraindikasi_kehamilan: "B",
      frekuensi_default: "3x1",
      waktu_minum_default: "pc",
      is_formularium_nas: true
    }
  });

  const metf = await prisma.master_obat_zat_aktif.create({
    data: {
      nama_generik: "Metformin HCl",
      nama_alias: ["Metformin", "Glucophage"],
      kode_atc: "A10BA02",
      kelas_terapi: "Antidiabetik",
      subkelas_terapi: "Biguanida",
      golongan_obat: "Keras",
      dosis_lazim_dewasa: "500mg - 850mg tiap 12 jam",
      dosis_lazim_anak: "500mg tiap 12 jam (anak >10 tahun)",
      dosis_max_harian: 2550,
      perlu_penyesuaian_ginjal: true,
      perlu_penyesuaian_hepar: true,
      kontraindikasi_kehamilan: "B",
      frekuensi_default: "2x1",
      waktu_minum_default: "pc",
      is_formularium_nas: true
    }
  });

  const amlo = await prisma.master_obat_zat_aktif.create({
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

  const ator = await prisma.master_obat_zat_aktif.create({
    data: {
      nama_generik: "Atorvastatin Calcium",
      nama_alias: ["Atorvastatin", "Lipitor"],
      kode_atc: "C10AA05",
      kelas_terapi: "Antihiperlipidemia",
      subkelas_terapi: "HMG-CoA Reductase Inhibitor (Statin)",
      golongan_obat: "Keras",
      dosis_lazim_dewasa: "10mg - 80mg tiap 24 jam",
      dosis_lazim_anak: "10mg tiap 24 jam (anak >10 tahun)",
      dosis_max_harian: 80,
      perlu_penyesuaian_ginjal: false,
      perlu_penyesuaian_hepar: true,
      kontraindikasi_kehamilan: "X",
      frekuensi_default: "1x1",
      waktu_minum_default: "hs",
      is_formularium_nas: true
    }
  });

  const pct = await prisma.master_obat_zat_aktif.create({
    data: {
      nama_generik: "Paracetamol",
      nama_alias: ["Acetaminophen", "PCT", "Panadol", "Sanamol"],
      kode_atc: "N02BE01",
      kelas_terapi: "Analgesik / Antipiretik",
      subkelas_terapi: "Anilida",
      golongan_obat: "Bebas",
      dosis_lazim_dewasa: "500mg - 1000mg tiap 4-6 jam",
      dosis_lazim_anak: "10 - 15mg/kgBB tiap 4-6 jam",
      dosis_max_harian: 4000,
      perlu_penyesuaian_ginjal: true,
      perlu_penyesuaian_hepar: true,
      kontraindikasi_kehamilan: "B",
      frekuensi_default: "3x1",
      waktu_minum_default: "pc",
      is_formularium_nas: true
    }
  });

  const mtx = await prisma.master_obat_zat_aktif.create({
    data: {
      nama_generik: "Methotrexate",
      nama_alias: ["MTX", "Rheumatrex", "Emtexate"],
      kode_atc: "L01BA01",
      kelas_terapi: "Antineoplastik / Imunosupresan",
      subkelas_terapi: "Antimetabolit Folat",
      golongan_obat: "Keras",
      dosis_lazim_dewasa: "7.5mg - 25mg seminggu sekali (Arthritis/Psoriasis)",
      dosis_max_harian: 25,
      perlu_penyesuaian_ginjal: true,
      perlu_penyesuaian_hepar: true,
      kontraindikasi_kehamilan: "X",
      frekuensi_default: "1xSeminggu",
      waktu_minum_default: "bebas",
      is_formularium_nas: true
    }
  });

  console.log(`-> Successfully seeded ${6} Active Substances.`);

  // 2. Seed Commercial Products (Produk Obat)
  console.log("\nSeeding Master Obat Produk...");

  const productAmoxan = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: amox.id,
      nama_dagang: "Amoxan",
      nama_produk_lengkap: "Amoxan 500mg Kapsul",
      kekuatan_dosis: "500mg",
      bentuk_sediaan: "Kapsul",
      rute_pemberian: "oral",
      satuan_terkecil: "kapsul",
      isi_per_kemasan: 10,
      produsen: "Sanbe Farma",
      no_registrasi_bpom: "DKL7222200101A1",
      tipe_produk: "branded-generik",
      is_bpjs: true,
      is_formularium_rs: true,
      prioritas_substitusi: 1
    }
  });

  const productGlucophage = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: metf.id,
      nama_dagang: "Glucophage XR",
      nama_produk_lengkap: "Glucophage XR 500mg Tablet",
      kekuatan_dosis: "500mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 30,
      produsen: "Merck KGaA",
      no_registrasi_bpom: "DKI0112345610B1",
      tipe_produk: "branded-generik",
      is_bpjs: true,
      is_formularium_rs: true,
      prioritas_substitusi: 1
    }
  });

  const productNorvask = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: amlo.id,
      nama_dagang: "Norvask",
      nama_produk_lengkap: "Norvask 5mg Tablet",
      kekuatan_dosis: "5mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 30,
      produsen: "Pfizer Indonesia",
      no_registrasi_bpom: "DKI9383748210A1",
      tipe_produk: "paten",
      is_bpjs: false,
      is_formularium_rs: true,
      prioritas_substitusi: 1
    }
  });

  const productLipitor = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: ator.id,
      nama_dagang: "Lipitor",
      nama_produk_lengkap: "Lipitor 20mg Tablet",
      kekuatan_dosis: "20mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 30,
      produsen: "Pfizer Indonesia",
      no_registrasi_bpom: "DKI9728374910B1",
      tipe_produk: "paten",
      is_bpjs: false,
      is_formularium_rs: true,
      prioritas_substitusi: 1
    }
  });

  const productSanamol = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: pct.id,
      nama_dagang: "Sanamol",
      nama_produk_lengkap: "Sanamol 500mg Tablet",
      kekuatan_dosis: "500mg",
      bentuk_sediaan: "Tablet",
      rute_pemberian: "oral",
      satuan_terkecil: "tablet",
      isi_per_kemasan: 10,
      produsen: "Sanbe Farma",
      no_registrasi_bpom: "DBL8323400510A1",
      tipe_produk: "branded-generik",
      is_bpjs: true,
      is_formularium_rs: true,
      prioritas_substitusi: 1
    }
  });

  console.log(`-> Successfully seeded ${5} Medicine Products.`);

  // 3. Seed Warehouses (Gudang)
  console.log("\nSeeding Master Gudang...");
  
  const g1 = await prisma.master_gudang.create({
    data: { nama_gudang: "Apotek Rawat Jalan Utama" }
  });
  
  const g2 = await prisma.master_gudang.create({
    data: { nama_gudang: "Apotek IGD 24 Jam" }
  });

  const g3 = await prisma.master_gudang.create({
    data: { nama_gudang: "Gudang Farmasi Sentral HNZ" }
  });

  console.log(`-> Successfully seeded ${3} Warehouses.`);

  // 4. Seed Stock (Stok Obat)
  console.log("\nSeeding Obat Stok...");

  // Stock for Amoxan
  await prisma.obat_stok.create({
    data: {
      produk_id: productAmoxan.id,
      gudang_id: g1.id_gudang,
      stok_tersedia: 500,
      stok_minimum: 100,
      no_batch: "BT-AMX26E1",
      expired_date: new Date('2028-10-15'),
      lokasi_rak: "RAK-B1"
    }
  });
  await prisma.obat_stok.create({
    data: {
      produk_id: productAmoxan.id,
      gudang_id: g3.id_gudang,
      stok_tersedia: 2500,
      stok_minimum: 500,
      no_batch: "BT-AMX26E2",
      expired_date: new Date('2029-01-20'),
      lokasi_rak: "SEKTOR-A2"
    }
  });

  // Stock for Glucophage
  await prisma.obat_stok.create({
    data: {
      produk_id: productGlucophage.id,
      gudang_id: g1.id_gudang,
      stok_tersedia: 800,
      stok_minimum: 150,
      no_batch: "BT-GLU26A1",
      expired_date: new Date('2028-06-30'),
      lokasi_rak: "RAK-B4"
    }
  });

  // Stock for Norvask
  await prisma.obat_stok.create({
    data: {
      produk_id: productNorvask.id,
      gudang_id: g1.id_gudang,
      stok_tersedia: 300,
      stok_minimum: 80,
      no_batch: "BT-NOR26H1",
      expired_date: new Date('2028-12-05'),
      lokasi_rak: "RAK-C2"
    }
  });
  await prisma.obat_stok.create({
    data: {
      produk_id: productNorvask.id,
      gudang_id: g2.id_gudang,
      stok_tersedia: 50,
      stok_minimum: 20,
      no_batch: "BT-NOR26H1",
      expired_date: new Date('2028-12-05'),
      lokasi_rak: "EMERGENCY-1"
    }
  });

  // Stock for Lipitor
  await prisma.obat_stok.create({
    data: {
      produk_id: productLipitor.id,
      gudang_id: g1.id_gudang,
      stok_tersedia: 120,
      stok_minimum: 50,
      no_batch: "BT-LIP26D3",
      expired_date: new Date('2028-09-18'),
      lokasi_rak: "RAK-C5"
    }
  });

  // Stock for Sanamol
  await prisma.obat_stok.create({
    data: {
      produk_id: productSanamol.id,
      gudang_id: g1.id_gudang,
      stok_tersedia: 1200,
      stok_minimum: 300,
      no_batch: "BT-SAN26K1",
      expired_date: new Date('2029-03-12'),
      lokasi_rak: "RAK-A3"
    }
  });
  await prisma.obat_stok.create({
    data: {
      produk_id: productSanamol.id,
      gudang_id: g2.id_gudang,
      stok_tersedia: 400,
      stok_minimum: 100,
      no_batch: "BT-SAN26K1",
      expired_date: new Date('2029-03-12'),
      lokasi_rak: "EMERGENCY-2"
    }
  });

  console.log("-> Successfully seeded medicine inventory stocks.");

  // 5. Seed Prices (Harga Obat)
  console.log("\nSeeding Obat Harga...");

  const products = [
    { p: productAmoxan, baseS: 1200, baseK: 12000 },
    { p: productGlucophage, baseS: 800, baseK: 24000 },
    { p: productNorvask, baseS: 4500, baseK: 135000 },
    { p: productLipitor, baseS: 11000, baseK: 330000 },
    { p: productSanamol, baseS: 300, baseK: 3000 }
  ];

  for (const item of products) {
    // 1. Harga Umum (15% markup)
    await prisma.obat_harga.create({
      data: {
        produk_id: item.p.id,
        jenis_jaminan: "umum",
        harga_satuan: item.baseS * 1.15,
        harga_kemasan: item.baseK * 1.15,
        is_e_katalog: false,
        berlaku_dari: new Date('2026-01-01')
      }
    });

    // 2. Harga BPJS (10% markdown, controlled price if eligible, else same)
    if (item.p.is_bpjs) {
      await prisma.obat_harga.create({
        data: {
          produk_id: item.p.id,
          jenis_jaminan: "bpjs",
          harga_satuan: item.baseS * 0.9,
          harga_kemasan: item.baseK * 0.9,
          is_e_katalog: true,
          berlaku_dari: new Date('2026-01-01')
        }
      });
    }

    // 3. Harga Asuransi Premium (20% markup, premium packages)
    await prisma.obat_harga.create({
      data: {
        produk_id: item.p.id,
        jenis_jaminan: "asuransi_a",
        harga_satuan: item.baseS * 1.2,
        harga_kemasan: item.baseK * 1.2,
        is_e_katalog: false,
        berlaku_dari: new Date('2026-01-01')
      }
    });
  }

  console.log("-> Successfully seeded medicine tariff pricing levels.");

  // 6. Seed Interactions (Interaksi Obat)
  console.log("\nSeeding Obat Interaksi...");

  // Interaction 1: Amoxicillin + Methotrexate
  await prisma.obat_interaksi.create({
    data: {
      zat_aktif_a_id: amox.id,
      zat_aktif_b_id: mtx.id,
      tingkat_keparahan: "major",
      efek_klinis: "Penisilin (Amoxicillin) menurunkan ekskresi ginjal dari Methotrexate, berisiko memicu toksisitas Methotrexate yang fatal (supresi sumsum tulang belakang, nefrotoksisitas, hepatotoksisitas).",
      rekomendasi: "Hindari kombinasi obat ini. Gunakan antibiotik alternatif seperti Makrolida jika memerlukan terapi infeksi bakteri pada pasien pengguna Methotrexate.",
      sumber_referensi: "Drugs.com / Medscape Drug Interactions Manager",
      is_alergi_silang: false,
      berlaku_untuk_kelas: false
    }
  });

  // Interaction 2: Atorvastatin + Amlodipine
  await prisma.obat_interaksi.create({
    data: {
      zat_aktif_a_id: ator.id,
      zat_aktif_b_id: amlo.id,
      tingkat_keparahan: "moderate",
      efek_klinis: "Amlodipine berisiko meningkatkan kadar plasma Atorvastatin secara sistemik, menaikkan risiko efek samping miopati atau rabdomiolisis.",
      rekomendasi: "Batasi dosis harian Atorvastatin maksimal 20mg bila diberikan bersama Amlodipine, atau pantau berkala kadar kreatinin kinase (CK) pasien.",
      sumber_referensi: "MIMS Indonesia / FDA Safety Guidelines",
      is_alergi_silang: false,
      berlaku_untuk_kelas: false
    }
  });

  // Interaction 3: Metformin + Methotrexate
  await prisma.obat_interaksi.create({
    data: {
      zat_aktif_a_id: metf.id,
      zat_aktif_b_id: mtx.id,
      tingkat_keparahan: "minor",
      efek_klinis: "Kedua obat memiliki rute eliminasi ginjal yang sama. Potensi kecil kenaikan asam laktat darah.",
      rekomendasi: "Pantau fungsi filtrasi laju eGFR ginjal pasien secara berkala.",
      sumber_referensi: "Drugs.com",
      is_alergi_silang: false,
      berlaku_untuk_kelas: false
    }
  });

  console.log("-> Successfully seeded safety drug-drug interactions.");

  console.log("\n====================================================");
  console.log("🎉 ALL SEED DATA SUCCESSFULLY SYNCED TO DATABASE! 🎉");
  console.log("====================================================");

  process.exit(0);
}

main().catch(err => {
  console.error("❌ ERROR SEEDING DATABASE:", err);
  process.exit(1);
});
