require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkInvoices() {
  console.log('============= 💰 DAFTAR INVOICE BILLING PASIEN TERBARU =============\n');

  try {
    const listTagihan = await prisma.tagihan.findMany({
      include: {
        kunjungan: {
          include: {
            pasien: true
          }
        },
        tagihan_detail: {
          include: {
            tagihan_detail_komponen: true
          }
        }
      },
      orderBy: {
        no_invoice: 'desc'
      },
      take: 5
    });

    if (listTagihan.length === 0) {
      console.log('❌ Belum ada data invoice pasien di database.');
      return;
    }

    listTagihan.forEach((tagihan, index) => {
      const pasien = tagihan.kunjungan?.pasien;
      console.log(`${index + 1}. 📄 INVOICE: ${tagihan.no_invoice}`);
      console.log(`   🏥 Pasien       : ${pasien?.nama_lengkap} (${pasien?.no_rm})`);
      console.log(`   💳 Metode Bayar : ${tagihan.metode_pembayaran}`);
      console.log(`   ⚠️ Status       : ${tagihan.status_bayar}`);
      console.log(`   💰 Total Netto  : Rp ${parseInt(tagihan.total_netto).toLocaleString('id-ID')}`);
      console.log(`   📋 Item Layanan :`);

      tagihan.tagihan_detail.forEach((detail) => {
        console.log(`      - ${detail.item_layanan} (${detail.kategori_biaya}) -> Rp ${parseInt(detail.harga_satuan).toLocaleString('id-ID')}`);
        
        if (detail.tagihan_detail_komponen.length > 0) {
          console.log(`        🪙 Rincian Komponen Biaya:`);
          detail.tagihan_detail_komponen.forEach((komp) => {
            console.log(`          * ${komp.nama_komponen}: Rp ${parseInt(komp.nilai_tarif).toLocaleString('id-ID')}`);
          });
        }
      });
      console.log('\n------------------------------------------------------------------\n');
    });

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat membaca database:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkInvoices();
