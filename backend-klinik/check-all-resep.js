require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== CHECKING ALL PRESCRIPTIONS (DIRECT) ===");
  
  const reseps = await prisma.resep.findMany({
    include: {
      kunjungan: {
        include: {
          pasien: true,
          pemeriksaan_dokter: true
        }
      },
      resep_item: true
    }
  });

  console.log(`Total Resep found: ${reseps.length}`);
  for (const r of reseps) {
    const k = r.kunjungan;
    const p = k?.pasien;
    console.log(`\nResep No: ${r.no_resep} (ID: ${r.id_resep})`);
    console.log(`Status Resep: ${r.status_resep}`);
    console.log(`Patient Name: ${p?.nama_lengkap || 'UNKNOWN'} (RM: ${p?.no_rm || 'UNKNOWN'})`);
    console.log(`Visit ID: ${k?.id_kunjungan || 'UNKNOWN'}`);
    console.log(`SOAP (pemeriksaan_dokter) entries found for this visit: ${k?.pemeriksaan_dokter?.length || 0}`);
    if (k?.pemeriksaan_dokter) {
      k.pemeriksaan_dokter.forEach(pd => {
        console.log(`  SOAP ID: ${pd.id_pemeriksaan} | Subjective: "${pd.anamnesis_subjektif}"`);
      });
    }
    console.log(`Resep Items (${r.resep_item.length}):`);
    r.resep_item.forEach((ri, idx) => {
      console.log(`  ${idx + 1}. Obat ID: ${ri.id_obat || 'Compound/Racikan'}, Nama: "${ri.nama_obat}", Qty: ${ri.jumlah}, Rule: "${ri.aturan_pakai}"`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
