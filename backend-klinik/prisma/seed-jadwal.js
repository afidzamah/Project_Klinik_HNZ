require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dummyDoctors = {
  'Poli Umum': [
    { nama_dokter: 'Dr. Andi Wijaya', sip_dokter: '123/SIP/UMUM/2026' },
    { nama_dokter: 'Dr. Siti Aminah', sip_dokter: '124/SIP/UMUM/2026' },
    { nama_dokter: 'Dr. Faisal Bahar', sip_dokter: '201/SIP/UMUM/2026' },
    { nama_dokter: 'Dr. Rina Kartika', sip_dokter: '202/SIP/UMUM/2026' },
    { nama_dokter: 'Dr. Eko Prasetyo', sip_dokter: '203/SIP/UMUM/2026' }
  ],
  'Poli Anak (Pediatri)': [
    { nama_dokter: 'Dr. Rian Pratama, Sp.A', sip_dokter: '125/SIP/ANAK/2026' },
    { nama_dokter: 'Dr. Lilis Lestari, Sp.A', sip_dokter: '126/SIP/ANAK/2026' },
    { nama_dokter: 'Dr. Amanda Safitri, Sp.A', sip_dokter: '204/SIP/ANAK/2026' },
    { nama_dokter: 'Dr. Dwi Haryanto, Sp.A', sip_dokter: '205/SIP/ANAK/2026' },
    { nama_dokter: 'Dr. Yuniar Rahma, Sp.A', sip_dokter: '206/SIP/ANAK/2026' }
  ],
  'Poli Gigi & Mulut': [
    { nama_dokter: 'Drg. Budi Santoso', sip_dokter: '127/SIP/GIGI/2026' },
    { nama_dokter: 'Drg. Clarissa Olivia', sip_dokter: '207/SIP/GIGI/2026' },
    { nama_dokter: 'Drg. Farhan Ramadhan', sip_dokter: '208/SIP/GIGI/2026' },
    { nama_dokter: 'Drg. Gita Permata', sip_dokter: '209/SIP/GIGI/2026' },
    { nama_dokter: 'Drg. Harry Wibowo', sip_dokter: '210/SIP/GIGI/2026' }
  ],
  'Poli Penyakit Dalam': [
    { nama_dokter: 'Dr. Hendra Wijaya, Sp.PD', sip_dokter: '128/SIP/DALAM/2026' },
    { nama_dokter: 'Dr. Irene Margaretha, Sp.PD', sip_dokter: '211/SIP/DALAM/2026' },
    { nama_dokter: 'Dr. Joko Susilo, Sp.PD', sip_dokter: '212/SIP/DALAM/2026' },
    { nama_dokter: 'Dr. Kartika Sari, Sp.PD', sip_dokter: '213/SIP/DALAM/2026' },
    { nama_dokter: 'Dr. Lukman Hakim, Sp.PD', sip_dokter: '214/SIP/DALAM/2026' }
  ],
  'Poli Kandungan (Obgyn)': [
    { nama_dokter: 'Dr. Mega Utami, Sp.OG', sip_dokter: '129/SIP/OBGYN/2026' },
    { nama_dokter: 'Dr. Nina Herlina, Sp.OG', sip_dokter: '215/SIP/OBGYN/2026' },
    { nama_dokter: 'Dr. Oscar Yudistira, Sp.OG', sip_dokter: '216/SIP/OBGYN/2026' },
    { nama_dokter: 'Dr. Putri Mayasari, Sp.OG', sip_dokter: '217/SIP/OBGYN/2026' },
    { nama_dokter: 'Dr. Rahmat Hidayat, Sp.OG', sip_dokter: '218/SIP/OBGYN/2026' }
  ]
};

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const shifts = [
  { start: '08:00', end: '12:00', hours: 4 },
  { start: '13:00', end: '17:00', hours: 4 },
  { start: '17:00', end: '21:00', hours: 4 }
];

async function main() {
  console.log('Seeding 5 dummy doctors per polyclinic...');

  // Load all existing polikliniks
  const dbPolis = await prisma.master_poliklinik.findMany();
  
  if (dbPolis.length === 0) {
    throw new Error('Poliklinik tidak ditemukan. Pastikan backend sudah melakukan onModuleInit seed.');
  }

  const poliklinikMap = {};
  for (const poli of dbPolis) {
    poliklinikMap[poli.nama_poli] = poli.id_poli;
  }

  // Create or update doctors so that each poli has at least 5 doctors
  const doctorsCreated = [];
  
  for (const [poliName, docs] of Object.entries(dummyDoctors)) {
    const idPoli = poliklinikMap[poliName];
    if (!idPoli) {
      console.warn(`Poliklinik "${poliName}" tidak ditemukan di database. Melewati.`);
      continue;
    }

    for (const doc of docs) {
      const createdDoc = await prisma.master_dokter.upsert({
        where: { sip_dokter: doc.sip_dokter },
        update: {
          id_poli: idPoli,
          status_aktif: true
        },
        create: {
          nama_dokter: doc.nama_dokter,
          sip_dokter: doc.sip_dokter,
          id_poli: idPoli,
          status_aktif: true
        }
      });
      doctorsCreated.push(createdDoc);
    }
  }

  console.log(`✅ Sukses mendaftarkan ${doctorsCreated.length} Dokter Dummy (5 dokter per poli)!`);

  // Clear existing schedules to ensure fresh random scheduling
  console.log('Clearing existing doctor schedules...');
  await prisma.jadwal_dokter.deleteMany({});
  console.log('✅ Jadwal lama dibersihkan.');

  console.log('Generating random schedules across Monday to Sunday...');

  let scheduleCount = 0;

  // Let's create a beautiful randomized schedule
  // For each day, we will select a few doctors from each poliklinik and assign them to one of the shifts
  for (const day of days) {
    for (const [poliName, docs] of Object.entries(dummyDoctors)) {
      const idPoli = poliklinikMap[poliName];
      if (!idPoli) continue;

      // Fetch the doctors actually in the DB for this poli to get their actual UUIDs
      const dbDocs = await prisma.master_dokter.findMany({
        where: { id_poli: idPoli }
      });

      if (dbDocs.length === 0) continue;

      // For this day and this polyclinic:
      // Pick 2 random doctors to work today
      const shuffledDocs = [...dbDocs].sort(() => 0.5 - Math.random());
      const workingDocs = shuffledDocs.slice(0, 2);

      // Assign each chosen doctor to a random non-overlapping shift
      const shuffledShifts = [...shifts].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < workingDocs.length; i++) {
        const doctor = workingDocs[i];
        const shift = shuffledShifts[i]; // No overlap since we slice unique shifts

        // Quota is 4 per hour
        const kuota = shift.hours * 4;

        await prisma.jadwal_dokter.create({
          data: {
            hari: day,
            id_poli: idPoli,
            id_dokter: doctor.id_dokter,
            jam_mulai: shift.start,
            jam_selesai: shift.end,
            kuota: kuota
          }
        });
        scheduleCount++;
      }
    }
  }

  console.log(`✅ Sukses membuat ${scheduleCount} Jadwal Dokter baru yang acak (Senin-Minggu terisi penuh)!`);
}

main()
  .catch((e) => {
    console.error('Error during seeding doctor schedules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
