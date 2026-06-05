require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const id_kunjungan = "1e45f052-7f20-4839-afb1-cc5c9de1b40b";
  console.log("=== CHECKING TAGIHAN FOR MUHAMMAD AFID ===");

  const tagihans = await prisma.tagihan.findMany({
    where: { id_kunjungan },
    include: {
      tagihan_detail: {
        include: {
          tagihan_detail_komponen: true
        }
      },
      kunjungan: {
        include: {
          pasien: true
        }
      }
    }
  });

  console.log(`Found ${tagihans.length} tagihan record(s) for this visit:`);
  for (const t of tagihans) {
    console.log(`\nTagihan ID: ${t.id_tagihan}`);
    console.log(`Invoice No: ${t.no_invoice}`);
    console.log(`Status Bayar: ${t.status_bayar}`);
    console.log(`Metode Pembayaran: ${t.metode_pembayaran}`);
    console.log(`Total Bruto: Rp ${Number(t.total_bruto).toLocaleString('id-ID')}`);
    console.log(`Total Netto: Rp ${Number(t.total_netto).toLocaleString('id-ID')}`);
    console.log(`Details (${t.tagihan_detail.length}):`);
    t.tagihan_detail.forEach((td, idx) => {
      console.log(`  ${idx + 1}. Item: "${td.item_layanan}", Category: "${td.kategori_biaya}", Price: Rp ${Number(td.harga_satuan).toLocaleString('id-ID')}, Qty: ${td.kuantitas}, Subtotal: Rp ${Number(td.subtotal).toLocaleString('id-ID')}`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
