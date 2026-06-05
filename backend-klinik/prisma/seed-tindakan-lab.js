require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const labTindakans = [
  // 1. Laboratorium Klinik
  { nama: 'Pemeriksaan Darah Lengkap', kategori: 'Laboratorium', basePrice: 80000 },
  { nama: 'Pemeriksaan Urine Lengkap', kategori: 'Laboratorium', basePrice: 55000 },
  { nama: 'Pemeriksaan Glukosa Darah Puasa', kategori: 'Laboratorium', basePrice: 30000 },
  { nama: 'Pemeriksaan Glukosa Darah 2 Jam PP', kategori: 'Laboratorium', basePrice: 30000 },
  { nama: 'Pemeriksaan HbA1c', kategori: 'Laboratorium', basePrice: 180000 },
  { nama: 'Pemeriksaan Kolesterol Total', kategori: 'Laboratorium', basePrice: 45000 },
  { nama: 'Pemeriksaan HDL Kolesterol', kategori: 'Laboratorium', basePrice: 55000 },
  { nama: 'Pemeriksaan LDL Kolesterol', kategori: 'Laboratorium', basePrice: 75000 },
  { nama: 'Pemeriksaan Trigliserida', kategori: 'Laboratorium', basePrice: 50000 },
  { nama: 'Pemeriksaan SGOT (AST)', kategori: 'Laboratorium', basePrice: 40000 },
  { nama: 'Pemeriksaan SGPT (ALT)', kategori: 'Laboratorium', basePrice: 40000 },
  { nama: 'Pemeriksaan Ureum Darah', kategori: 'Laboratorium', basePrice: 45000 },
  { nama: 'Pemeriksaan Kreatinin Darah', kategori: 'Laboratorium', basePrice: 45000 },
  { nama: 'Pemeriksaan Asam Urat Darah', kategori: 'Laboratorium', basePrice: 40000 },

  // 2. Patologi Anatomi
  { nama: 'Histopatologi Biopsi Kecil', kategori: 'Laboratorium', basePrice: 350000 },
  { nama: 'Histopatologi Biopsi Sedang', kategori: 'Laboratorium', basePrice: 550000 },
  { nama: 'Histopatologi Biopsi Besar', kategori: 'Laboratorium', basePrice: 850000 },
  { nama: 'Sitologi Cairan Tubuh (Pleura/Asites)', kategori: 'Laboratorium', basePrice: 250000 },
  { nama: 'Fine Needle Aspiration Biopsy (FNAB)', kategori: 'Laboratorium', basePrice: 450000 },
  { nama: 'Cervical Pap Smear', kategori: 'Laboratorium', basePrice: 150000 },

  // 3. Mikrobiologi
  { nama: 'Pemeriksaan Pewarnaan Gram', kategori: 'Laboratorium', basePrice: 65000 },
  { nama: 'Pemeriksaan Pewarnaan BTA', kategori: 'Laboratorium', basePrice: 90000 },
  { nama: 'Kultur & Sensitivitas Bakteri Aerob', kategori: 'Laboratorium', basePrice: 350000 },
  { nama: 'Pemeriksaan Jamur (KOH)', kategori: 'Laboratorium', basePrice: 60000 }
];

// Multipliers
const classMultipliers = {
  'VIP': 1.5,
  'Kelas 1': 1.2,
  'Kelas 2': 1.0,
  'Kelas 3': 0.8,
  'Rawat Jalan': 1.0
};

const bayarMultipliers = {
  'Umum Pribadi': 1.0,
  'Asuransi': 1.3,
  'Perusahaan': 1.2,
  'BPJS': 0.85
};

// Component Splits (Total must equal 100%)
const componentSplits = {
  'Jasa Sarana': 0.60,
  'Jasa Medis (Dokter)': 0.20,
  'Jasa Perawat': 0.10,
  'Bahan Medis Habis Pakai (BHP)': 0.10
};

async function main() {
  console.log('Starting seed-tindakan-lab script...');

  // Fetch classes, payment methods, and components from DB
  const classes = await prisma.master_kelas.findMany();
  const bayars = await prisma.master_cara_bayar.findMany();
  const components = await prisma.master_komponen_tarif.findMany();

  console.log(`Loaded ${classes.length} classes, ${bayars.length} payment methods, ${components.length} components.`);

  let createdTindakan = 0;
  let createdHarga = 0;
  let createdHargaKomponen = 0;

  for (const t of labTindakans) {
    // 1. Create or get master_tindakan
    let tindakan = await prisma.master_tindakan.findFirst({
      where: { nama_tindakan: t.nama }
    });

    if (!tindakan) {
      tindakan = await prisma.master_tindakan.create({
        data: {
          nama_tindakan: t.nama,
          kategori_tindakan: t.kategori,
          status_aktif: true
        }
      });
      createdTindakan++;
    } else {
      // Ensure the category is correct
      tindakan = await prisma.master_tindakan.update({
        where: { id_tindakan: tindakan.id_tindakan },
        data: { kategori_tindakan: t.kategori }
      });
    }

    // 2. Loop classes and payment methods to create price rows
    for (const c of classes) {
      const classMult = classMultipliers[c.nama_kelas] || 1.0;

      for (const b of bayars) {
        const bayarMult = bayarMultipliers[b.nama_cara_bayar] || 1.0;

        // Calculate total price (rounded to nearest 100 Rupiah for billing elegance)
        const rawTotalPrice = t.basePrice * classMult * bayarMult;
        const totalPrice = Math.round(rawTotalPrice / 100) * 100;

        // Create or update master_harga_tindakan
        let harga = await prisma.master_harga_tindakan.findFirst({
          where: {
            id_tindakan: tindakan.id_tindakan,
            id_kelas: c.id_kelas,
            id_cara_bayar: b.id_cara_bayar
          }
        });

        if (!harga) {
          harga = await prisma.master_harga_tindakan.create({
            data: {
              id_tindakan: tindakan.id_tindakan,
              id_kelas: c.id_kelas,
              id_cara_bayar: b.id_cara_bayar,
              total_tarif: totalPrice,
              status_aktif: true
            }
          });
          createdHarga++;
        } else {
          harga = await prisma.master_harga_tindakan.update({
            where: { id_harga: harga.id_harga },
            data: { total_tarif: totalPrice }
          });
        }

        // 3. Create or update components details
        let sumComputed = 0;
        const calculatedComponents = [];

        // Distribute components, keeping track of cumulative rounding to match total exactly
        for (let i = 0; i < components.length; i++) {
          const comp = components[i];
          const split = componentSplits[comp.nama_komponen] || 0;
          
          let val = 0;
          if (i === components.length - 1) {
            // Last component gets the remainder to match total_tarif perfectly
            val = totalPrice - sumComputed;
          } else {
            val = Math.round((totalPrice * split) / 100) * 100;
            sumComputed += val;
          }

          calculatedComponents.push({
            id_komponen: comp.id_komponen,
            nilai_tarif: val
          });
        }

        for (const cc of calculatedComponents) {
          const existingDetail = await prisma.master_harga_tindakan_komponen.findFirst({
            where: {
              id_harga: harga.id_harga,
              id_komponen: cc.id_komponen
            }
          });

          if (!existingDetail) {
            await prisma.master_harga_tindakan_komponen.create({
              data: {
                id_harga: harga.id_harga,
                id_komponen: cc.id_komponen,
                nilai_tarif: cc.nilai_tarif
              }
            });
            createdHargaKomponen++;
          } else {
            await prisma.master_harga_tindakan_komponen.update({
              where: { id_harga_detail: existingDetail.id_harga_detail },
              data: { nilai_tarif: cc.nilai_tarif }
            });
          }
        }
      }
    }
  }

  console.log('=== SEEDING SUMMARY ===');
  console.log(`Created new master_tindakan: ${createdTindakan}`);
  console.log(`Created new master_harga_tindakan: ${createdHarga}`);
  console.log(`Created new master_harga_tindakan_komponen: ${createdHargaKomponen}`);
  console.log('✅ Seeding laboratory actions & prices completed successfully!');
  
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
