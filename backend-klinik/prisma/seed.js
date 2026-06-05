require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding master data with Prisma Pg Adapter...');

  // 1. Seed Cara Bayar
  const caraBayarList = [
    { nama_cara_bayar: 'Umum Pribadi' },
    { nama_cara_bayar: 'Asuransi' },
    { nama_cara_bayar: 'Perusahaan' },
    { nama_cara_bayar: 'BPJS' },
  ];

  for (const cb of caraBayarList) {
    await prisma.master_cara_bayar.upsert({
      where: { nama_cara_bayar: cb.nama_cara_bayar },
      update: {},
      create: cb,
    });
  }

  // Ambil ID dari database setelah insert/upsert
  const cbAsuransi = await prisma.master_cara_bayar.findUnique({ where: { nama_cara_bayar: 'Asuransi' } });
  const cbPerusahaan = await prisma.master_cara_bayar.findUnique({ where: { nama_cara_bayar: 'Perusahaan' } });
  const cbBPJS = await prisma.master_cara_bayar.findUnique({ where: { nama_cara_bayar: 'BPJS' } });

  // 2. Seed Penjamin
  const penjaminList = [
    // Asuransi
    { nama_penjamin: 'Prudential', id_cara_bayar: cbAsuransi.id_cara_bayar },
    { nama_penjamin: 'Allianz', id_cara_bayar: cbAsuransi.id_cara_bayar },
    { nama_penjamin: 'AIA', id_cara_bayar: cbAsuransi.id_cara_bayar },
    { nama_penjamin: 'AXA Mandiri', id_cara_bayar: cbAsuransi.id_cara_bayar },
    { nama_penjamin: 'Manulife', id_cara_bayar: cbAsuransi.id_cara_bayar },
    
    // Perusahaan
    { nama_penjamin: 'PT Telkom Indonesia', id_cara_bayar: cbPerusahaan.id_cara_bayar },
    { nama_penjamin: 'PT Pertamina', id_cara_bayar: cbPerusahaan.id_cara_bayar },
    { nama_penjamin: 'PT Bank Mandiri', id_cara_bayar: cbPerusahaan.id_cara_bayar },
    { nama_penjamin: 'PT Astra International', id_cara_bayar: cbPerusahaan.id_cara_bayar },
    { nama_penjamin: 'PT GoTo Gojek Tokopedia', id_cara_bayar: cbPerusahaan.id_cara_bayar },
    
    // BPJS
    { nama_penjamin: 'BPJS Kesehatan', id_cara_bayar: cbBPJS.id_cara_bayar },
    { nama_penjamin: 'BPJS Ketenagakerjaan', id_cara_bayar: cbBPJS.id_cara_bayar },
  ];

  for (const pj of penjaminList) {
    const existing = await prisma.master_penjamin.findFirst({
      where: {
        nama_penjamin: pj.nama_penjamin,
        id_cara_bayar: pj.id_cara_bayar,
      },
    });
    if (!existing) {
      await prisma.master_penjamin.create({
        data: pj,
      });
    }
  }

  // 3. Seed Asal Rujukan
  const asalRujukanList = [
    { nama_asal_rujukan: 'Datang Sendiri' },
    { nama_asal_rujukan: 'Klinik / Rumah Sakit' },
    { nama_asal_rujukan: 'Internal' },
  ];

  for (const ar of asalRujukanList) {
    await prisma.master_asal_rujukan.upsert({
      where: { nama_asal_rujukan: ar.nama_asal_rujukan },
      update: {},
      create: ar,
    });
  }

  console.log('✅ Seeding master data completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
