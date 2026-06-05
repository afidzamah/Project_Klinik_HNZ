require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== CHECKING ALL EXAMINATIONS & PRESCRIPTIONS ===");
  
  const pemeriksaanCount = await prisma.pemeriksaan_dokter.count();
  const resepCount = await prisma.resep.count();
  const resepItemCount = await prisma.resep_item.count();
  const pasienCount = await prisma.pasien.count();
  
  console.log(`Pasien Count: ${pasienCount}`);
  console.log(`Pemeriksaan Dokter Count: ${pemeriksaanCount}`);
  console.log(`Resep Count: ${resepCount}`);
  console.log(`Resep Item Count: ${resepItemCount}`);

  if (pemeriksaanCount > 0) {
    const list = await prisma.pemeriksaan_dokter.findMany({
      include: {
        kunjungan: {
          include: {
            pasien: true,
            resep: {
              include: {
                resep_item: true
              }
            }
          }
        }
      }
    });

    console.log("\n=== LIST OF PATIENTS & PRESCRIPTIONS IN DB ===");
    list.forEach(p => {
      const pasien = p.kunjungan?.pasien;
      const resepList = p.kunjungan?.resep || [];
      console.log(`\nPatient: ${pasien?.nama_lengkap} (${pasien?.no_rm})`);
      console.log(`Examination ID: ${p.id_pemeriksaan}, Created At: ${p.created_at || p.tgl_kunjungan}`);
      console.log(`Resep Count for this visit: ${resepList.length}`);
      resepList.forEach(r => {
        console.log(`  Resep: ${r.no_resep} (ID: ${r.id_resep}), Status: ${r.status_resep}`);
        r.resep_item.forEach(ri => {
          console.log(`    - Item ID: ${ri.id_item}, Obat ID: ${ri.obat_id || 'Compound/Racikan'}, Jumlah: ${ri.jumlah}, Aturan: ${ri.aturan_pakai}`);
        });
      });
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
