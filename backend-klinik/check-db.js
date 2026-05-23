const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const jenisAlamatCount = await prisma.master_jenis_alamat.count();
  const provinsiCount = await prisma.master_provinsi.count();
  const kabupatenCount = await prisma.master_kabupaten.count();
  const kecamatanCount = await prisma.master_kecamatan.count();
  const kelurahanCount = await prisma.master_kelurahan.count();
  
  console.log("=== MASTER WILAYAH COUNTS ===");
  console.log("Jenis Alamat:", jenisAlamatCount);
  console.log("Provinsi:", provinsiCount);
  console.log("Kabupaten:", kabupatenCount);
  console.log("Kecamatan:", kecamatanCount);
  console.log("Kelurahan:", kelurahanCount);

  if (provinsiCount > 0) {
    const provs = await prisma.master_provinsi.findMany({ take: 5 });
    console.log("Contoh Provinsi:", provs);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
