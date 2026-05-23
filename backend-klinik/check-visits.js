const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const p = await prisma.pasien.findUnique({
    where: { no_rm: 'RM-HNZ-0001' }
  });
  if (!p) {
    console.log("Pasien RM-HNZ-0001 tidak ditemukan.");
    process.exit(0);
  }
  console.log("=== PASIEN ===");
  console.log(p);

  const kunjunganList = await prisma.kunjungan.findMany({
    where: { id_pasien: p.id_pasien },
    include: {
      pasien: true,
      antrean: true
    },
    orderBy: { tgl_kunjungan: 'desc' }
  });

  console.log("\n=== KUNJUNGAN LIST ===");
  kunjunganList.forEach(k => {
    console.log(`Kunjungan ID: ${k.id_kunjungan}, Tgl: ${k.tgl_kunjungan}, Poli: ${k.id_poli}, Dokter: ${k.id_dokter}, Status: ${k.status_kunjungan}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
