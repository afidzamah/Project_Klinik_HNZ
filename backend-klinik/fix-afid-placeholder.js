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
  
  const existing = await prisma.pemeriksaan_dokter.findFirst({
    where: { id_kunjungan }
  });

  if (!existing) {
    console.log("Placeholder EMR SOAP not found for Muhammad Afid. Creating...");
    const created = await prisma.pemeriksaan_dokter.create({
      data: {
        id_kunjungan,
        anamnesis_subjektif: 'Pemeriksaan Dokter (Resep Terkirim)',
        pemeriksaan_fisik_objektif: {},
        rencana_terapi_plan: '=== RESEP DIGITAL SAJA (SOAP MENYUSUL) ==='
      }
    });
    console.log("Created successfully:", created);
  } else {
    console.log("EMR SOAP already exists:", existing);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
