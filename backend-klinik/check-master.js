const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const polis = await prisma.master_poliklinik.findMany();
  console.log("=== POLIKLINIK ===");
  polis.forEach(p => {
    console.log(`ID: ${p.id_poli}, Nama: ${p.nama_poli}`);
  });

  const dokters = await prisma.master_dokter.findMany();
  console.log("\n=== DOKTER ===");
  dokters.forEach(d => {
    console.log(`ID: ${d.id_dokter}, Nama: ${d.nama_dokter}, Poli ID: ${d.id_poli}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
