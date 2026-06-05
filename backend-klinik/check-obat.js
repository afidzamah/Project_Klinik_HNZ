require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== DB SEEDING AND VERIFICATION FOR MASTER OBAT ===");

  // 1. Seed Active Substances (Zat Aktif)
  console.log("Seeding master_obat_zat_aktif...");
  const activeSubstanceAmox = await prisma.master_obat_zat_aktif.create({
    data: {
      nama_generik: "Amoxicillin",
      nama_alias: ["Amox", "Amoxil"],
      kode_atc: "J01CA04",
      kelas_terapi: "Antibiotik",
      subkelas_terapi: "Penicillin",
      golongan_obat: "Keras",
      dosis_lazim_dewasa: "250mg - 500mg tiap 8 jam",
      dosis_lazim_anak: "20-40mg/kgBB/hari",
      dosis_max_harian: 3000,
      perlu_penyesuaian_ginjal: true,
      perlu_penyesuaian_hepar: false,
      kontraindikasi_kehamilan: "B",
      frekuensi_default: "3x1",
      waktu_minum_default: "pc",
      is_formularium_nas: true
    }
  });
  console.log("-> Seeded Active Substance A:", activeSubstanceAmox.nama_generik, `(${activeSubstanceAmox.id})`);

  const activeSubstanceMtx = await prisma.master_obat_zat_aktif.create({
    data: {
      nama_generik: "Methotrexate",
      nama_alias: ["MTX", "Rheumatrex"],
      kode_atc: "L01BA01",
      kelas_terapi: "Antineoplastik / Imunosupresan",
      golongan_obat: "Keras",
      dosis_lazim_dewasa: "7.5mg - 15mg per minggu",
      dosis_max_harian: 25,
      perlu_penyesuaian_ginjal: true,
      perlu_penyesuaian_hepar: true,
      kontraindikasi_kehamilan: "X",
      is_formularium_nas: true
    }
  });
  console.log("-> Seeded Active Substance B:", activeSubstanceMtx.nama_generik, `(${activeSubstanceMtx.id})`);

  // 2. Seed Commercial Product (Produk Obat)
  console.log("\nSeeding master_obat_produk...");
  const productAmoxan = await prisma.master_obat_produk.create({
    data: {
      zat_aktif_id: activeSubstanceAmox.id,
      nama_dagang: "Amoxan",
      nama_produk_lengkap: "Amoxan 500mg Kapsul",
      kekuatan_dosis: "500mg",
      bentuk_sediaan: "Kapsul",
      rute_pemberian: "oral",
      satuan_terkecil: "kapsul",
      isi_per_kemasan: 10,
      produsen: "Sanbe Farma",
      no_registrasi_bpom: "DKL1234567891A1",
      tipe_produk: "branded-generik",
      is_bpjs: true,
      is_formularium_rs: true,
      prioritas_substitusi: 1
    }
  });
  console.log("-> Seeded Product:", productAmoxan.nama_produk_lengkap, `(${productAmoxan.id})`);

  // 3. Seed Warehouse (Gudang)
  console.log("\nSeeding master_gudang...");
  const warehouseApotek = await prisma.master_gudang.create({
    data: {
      nama_gudang: "Apotek Rawat Jalan HNZ"
    }
  });
  console.log("-> Seeded Warehouse:", warehouseApotek.nama_gudang, `(${warehouseApotek.id_gudang})`);

  // 4. Seed Stock (Stok)
  console.log("\nSeeding obat_stok...");
  const stockAmoxan = await prisma.obat_stok.create({
    data: {
      produk_id: productAmoxan.id,
      gudang_id: warehouseApotek.id_gudang,
      stok_tersedia: 1000,
      stok_minimum: 200,
      no_batch: "BATCH-AMX-001",
      expired_date: new Date('2028-12-31'),
      lokasi_rak: "RAK-A1-S1"
    }
  });
  console.log("-> Seeded Stock: available =", stockAmoxan.stok_tersedia, `batch = ${stockAmoxan.no_batch}`);

  // 5. Seed Price (Harga)
  console.log("\nSeeding obat_harga...");
  const priceAmoxan = await prisma.obat_harga.create({
    data: {
      produk_id: productAmoxan.id,
      jenis_jaminan: "umum",
      harga_satuan: 1500.00,
      harga_kemasan: 15000.00,
      is_e_katalog: false,
      berlaku_dari: new Date('2026-01-01')
    }
  });
  console.log("-> Seeded Price: unit =", priceAmoxan.harga_satuan, `pack = ${priceAmoxan.harga_kemasan}`);

  // 6. Seed Interactions (Interaksi Obat)
  console.log("\nSeeding obat_interaksi...");
  const interactionMtxAmox = await prisma.obat_interaksi.create({
    data: {
      zat_aktif_a_id: activeSubstanceAmox.id,
      zat_aktif_b_id: activeSubstanceMtx.id,
      tingkat_keparahan: "major",
      efek_klinis: "Meningkatkan risiko toksisitas Methotrexate (penurunan klirens ginjal oleh Amoxicillin).",
      rekomendasi: "Hindari kombinasi jika memungkinkan, atau pantau ketat tanda-tanda toksisitas hematologi dan fungsi ginjal.",
      sumber_referensi: "Drugs.com",
      is_alergi_silang: false,
      berlaku_untuk_kelas: false
    }
  });
  console.log("-> Seeded Drug-Drug Interaction:", interactionMtxAmox.tingkat_keparahan, `(${interactionMtxAmox.id})`);

  console.log("\n=== TESTING QUERIES ===");
  // Query product details with its active substance, stock, and price
  const queryProduct = await prisma.master_obat_produk.findUnique({
    where: { id: productAmoxan.id },
    include: {
      zat_aktif: true,
      obat_stok: true,
      obat_harga: true
    }
  });
  console.log("Query Results for Product complete details:");
  console.log(JSON.stringify(queryProduct, null, 2));

  // Query interactions for Amoxicillin
  const queryInteractions = await prisma.obat_interaksi.findMany({
    where: {
      OR: [
        { zat_aktif_a_id: activeSubstanceAmox.id },
        { zat_aktif_b_id: activeSubstanceAmox.id }
      ]
    },
    include: {
      zat_aktif_a: true,
      zat_aktif_b: true
    }
  });
  console.log("\nQuery Results for Drug Interactions associated with Amoxicillin:");
  console.log(JSON.stringify(queryInteractions, null, 2));

  // Clean up seeded records to keep db clean
  console.log("\nCleaning up seeded verification records...");
  await prisma.obat_interaksi.delete({ where: { id: interactionMtxAmox.id } });
  await prisma.obat_harga.delete({ where: { id: priceAmoxan.id } });
  await prisma.obat_stok.delete({ where: { id: stockAmoxan.id } });
  await prisma.master_gudang.delete({ where: { id_gudang: warehouseApotek.id_gudang } });
  await prisma.master_obat_produk.delete({ where: { id: productAmoxan.id } });
  await prisma.master_obat_zat_aktif.delete({ where: { id: activeSubstanceAmox.id } });
  await prisma.master_obat_zat_aktif.delete({ where: { id: activeSubstanceMtx.id } });
  console.log("Cleanup completed successfully.");

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
