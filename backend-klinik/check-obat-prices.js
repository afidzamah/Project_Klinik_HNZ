require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== CHECKING MASTER OBAT & PRICES ===");

  const obatList = await prisma.master_obat_produk.findMany({
    include: {
      obat_harga: true,
      obat_stok: true
    }
  });

  console.log(`Found ${obatList.length} master obat(s):`);
  for (const o of obatList) {
    console.log(`\nObat Name: ${o.nama_produk_lengkap} (ID: ${o.id})`);
    console.log(`Tipe: ${o.tipe_produk}`);
    console.log(`BPJS: ${o.is_bpjs}`);
    console.log(`Stok Total: ${o.obat_stok.reduce((acc, s) => acc + s.stok_tersedia, 0)}`);
    console.log(`Prices (${o.obat_harga.length}):`);
    o.obat_harga.forEach(h => {
      console.log(`  - Jenis Jaminan: ${h.jenis_jaminan}, Harga Satuan: Rp ${Number(h.harga_satuan).toLocaleString('id-ID')}`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
