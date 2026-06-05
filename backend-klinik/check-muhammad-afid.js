require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== DETAILED MUHAMMAD AFID VISIT CHECK ===");

  const visits = await prisma.kunjungan.findMany({
    where: {
      pasien: {
        nama_lengkap: {
          contains: 'afid',
          mode: 'insensitive'
        }
      }
    },
    include: {
      pasien: true,
      pemeriksaan_dokter: true,
      resep: {
        include: {
          resep_item: true
        }
      }
    }
  });

  console.log(`Found ${visits.length} visits for Muhammad Afid:`);
  visits.forEach((v, idx) => {
    console.log(`\nVisit #${idx + 1}:`);
    console.log(`  Visit ID: ${v.id_kunjungan}`);
    console.log(`  Date: ${v.tgl_kunjungan}`);
    console.log(`  Status Kunjungan: ${v.status_kunjungan}`);
    console.log(`  Patient: ${v.pasien?.nama_lengkap} (RM: ${v.pasien?.no_rm})`);
    console.log(`  SOAP (pemeriksaan_dokter) Count: ${v.pemeriksaan_dokter.length}`);
    v.pemeriksaan_dokter.forEach(pd => {
      console.log(`    - SOAP ID: ${pd.id_pemeriksaan}`);
      console.log(`      Subjective: "${pd.anamnesis_subjektif}"`);
      console.log(`      Plan: "${pd.rencana_terapi_plan}"`);
    });
    console.log(`  Resep Count: ${v.resep.length}`);
    v.resep.forEach(r => {
      console.log(`    - Resep ID: ${r.id_resep}`);
      console.log(`      No Resep: ${r.no_resep}`);
      console.log(`      Status Resep: ${r.status_resep}`);
      console.log(`      Items count: ${r.resep_item.length}`);
      r.resep_item.forEach(ri => {
        console.log(`        * Name: "${ri.nama_obat}", Qty: ${ri.jumlah}, Rule: "${ri.aturan_pakai}"`);
      });
    });
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
