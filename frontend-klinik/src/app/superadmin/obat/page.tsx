'use client';

import React, { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

// ================= DUMMY DATA PRELOADS =================
const DUMMY_ZAT_AKTIF = [
  {
    id: 'za-1',
    nama_generik: 'Amoxicillin Trihydrate',
    nama_alias: ['Amox', 'Amoxil', 'Amoxicilina'],
    kode_atc: 'J01CA04',
    kelas_terapi: 'Antibiotik',
    subkelas_terapi: 'Beta-Lactam Penicillin',
    golongan_obat: 'Keras',
    dosis_lazim_dewasa: '250mg - 500mg tiap 8 jam',
    dosis_lazim_anak: '20-40mg/kgBB/hari',
    dosis_max_harian: 3000,
    perlu_penyesuaian_ginjal: true,
    perlu_penyesuaian_hepar: false,
    kontraindikasi_kehamilan: 'B',
    frekuensi_default: '3x1',
    waktu_minum_default: 'pc',
    is_formularium_nas: true,
    is_aktif: true
  },
  {
    id: 'za-2',
    nama_generik: 'Metformin HCl',
    nama_alias: ['Metformin', 'Glucophage'],
    kode_atc: 'A10BA02',
    kelas_terapi: 'Antidiabetik',
    subkelas_terapi: 'Biguanida',
    golongan_obat: 'Keras',
    dosis_lazim_dewasa: '500mg - 850mg tiap 12 jam',
    dosis_lazim_anak: '500mg tiap 12 jam (anak >10 thn)',
    dosis_max_harian: 2550,
    perlu_penyesuaian_ginjal: true,
    perlu_penyesuaian_hepar: true,
    kontraindikasi_kehamilan: 'B',
    frekuensi_default: '2x1',
    waktu_minum_default: 'pc',
    is_formularium_nas: true,
    is_aktif: true
  },
  {
    id: 'za-3',
    nama_generik: 'Amlodipine Besylate',
    nama_alias: ['Amlodipine', 'Norvask'],
    kode_atc: 'C08CA01',
    kelas_terapi: 'Antihipertensi',
    subkelas_terapi: 'Calcium Channel Blocker',
    golongan_obat: 'Keras',
    dosis_lazim_dewasa: '5mg - 10mg tiap 24 jam',
    dosis_lazim_anak: '2.5mg - 5mg tiap 24 jam',
    dosis_max_harian: 10,
    perlu_penyesuaian_ginjal: false,
    perlu_penyesuaian_hepar: true,
    kontraindikasi_kehamilan: 'C',
    frekuensi_default: '1x1',
    waktu_minum_default: 'pc',
    is_formularium_nas: true,
    is_aktif: true
  },
  {
    id: 'za-4',
    nama_generik: 'Atorvastatin Calcium',
    nama_alias: ['Atorvastatin', 'Lipitor'],
    kode_atc: 'C10AA05',
    kelas_terapi: 'Antihiperlipidemia',
    subkelas_terapi: 'Statin (HMG-CoA Reductase)',
    golongan_obat: 'Keras',
    dosis_lazim_dewasa: '10mg - 80mg tiap 24 jam',
    dosis_lazim_anak: '10mg tiap 24 jam (anak >10 thn)',
    dosis_max_harian: 80,
    perlu_penyesuaian_ginjal: false,
    perlu_penyesuaian_hepar: true,
    kontraindikasi_kehamilan: 'X',
    frekuensi_default: '1x1',
    waktu_minum_default: 'hs',
    is_formularium_nas: true,
    is_aktif: true
  },
  {
    id: 'za-5',
    nama_generik: 'Paracetamol',
    nama_alias: ['PCT', 'Acetaminophen', 'Sanamol', 'Panadol'],
    kode_atc: 'N02BE01',
    kelas_terapi: 'Analgesik / Antipiretik',
    subkelas_terapi: 'Anilida',
    golongan_obat: 'Bebas',
    dosis_lazim_dewasa: '500mg - 1000mg tiap 4-6 jam',
    dosis_lazim_anak: '10 - 15mg/kgBB tiap 4-6 jam',
    dosis_max_harian: 4000,
    perlu_penyesuaian_ginjal: true,
    perlu_penyesuaian_hepar: true,
    kontraindikasi_kehamilan: 'B',
    frekuensi_default: '3x1',
    waktu_minum_default: 'pc',
    is_formularium_nas: true,
    is_aktif: true
  }
];

const DUMMY_PRODUCTS = [
  {
    id: 'prod-1',
    zat_aktif_id: 'za-1',
    nama_dagang: 'Amoxan',
    nama_produk_lengkap: 'Amoxan 500mg Kapsul',
    kekuatan_dosis: '500mg',
    bentuk_sediaan: 'Kapsul',
    rute_pemberian: 'oral',
    satuan_terkecil: 'kapsul',
    isi_per_kemasan: 10,
    produsen: 'Sanbe Farma',
    no_registrasi_bpom: 'DKL7222200101A1',
    tipe_produk: 'branded-generik',
    is_bpjs: true,
    is_formularium_rs: true,
    prioritas_substitusi: 1,
    is_aktif: true
  },
  {
    id: 'prod-2',
    zat_aktif_id: 'za-2',
    nama_dagang: 'Glucophage XR',
    nama_produk_lengkap: 'Glucophage XR 500mg Tablet',
    kekuatan_dosis: '500mg',
    bentuk_sediaan: 'Tablet',
    rute_pemberian: 'oral',
    satuan_terkecil: 'tablet',
    isi_per_kemasan: 30,
    produsen: 'Merck KGaA',
    no_registrasi_bpom: 'DKI0112345610B1',
    tipe_produk: 'branded-generik',
    is_bpjs: true,
    is_formularium_rs: true,
    prioritas_substitusi: 1,
    is_aktif: true
  }
];

const DUMMY_GUDANG = [
  { id: 'wh-1', nama_gudang: 'Apotek Rawat Jalan Utama' },
  { id: 'wh-2', nama_gudang: 'Apotek IGD 24 Jam' },
  { id: 'wh-3', nama_gudang: 'Gudang Farmasi Sentral HNZ' }
];

const DUMMY_STOK = [
  { id: 'stk-1', produk_id: 'prod-1', gudang_id: 'wh-1', stok_tersedia: 500, stok_minimum: 100, no_batch: 'BT-AMX26E1', expired_date: '2028-10-15', lokasi_rak: 'RAK-B1' },
  { id: 'stk-2', produk_id: 'prod-1', gudang_id: 'wh-3', stok_tersedia: 2500, stok_minimum: 500, no_batch: 'BT-AMX26E2', expired_date: '2029-01-20', lokasi_rak: 'SEKTOR-A2' }
];

const DUMMY_HARGA = [
  { id: 'prc-1', produk_id: 'prod-1', jenis_jaminan: 'umum', harga_satuan: 1380, harga_kemasan: 13800, is_e_katalog: false, berlaku_dari: '2026-01-01', berlaku_sampai: null }
];

const DUMMY_INTERAKSI = [
  {
    id: 'int-1',
    zat_aktif_a_id: 'za-1',
    zat_aktif_b_id: 'za-2',
    tingkat_keparahan: 'moderate',
    efek_klinis: 'Amoxicillin berisiko mempengaruhi flora usus yang berujung pada perubahan absorpsi obat antidiabetik.',
    rekomendasi: 'Pantau profil glikemik pasien secara berkala saat memulai terapi kombinasi.',
    sumber_referensi: 'Drugs.com',
    is_alergi_silang: false,
    berlaku_untuk_kelas: false
  }
];

const DUMMY_ATURAN_PAKAI = [
  /* ── LATIN ── */
  { id: 'ap-1', kategori: 'latin', input_dokter: ['od', 'omni die', 'o.d.'], format_standar: '1x1', frekuensi_hari: 1.0, dosis_per_minum: '1', waktu_minum: ['bebas'], catatan_implementasi: 'Sekali sehari, waktu tidak ditentukan kecuali ada tambahan.', is_penting: false, is_aktif: true },
  { id: 'ap-2', kategori: 'latin', input_dokter: ['bd', 'bis die', 'bid', 'b.i.d.', 'b.d.'], format_standar: '2x1', frekuensi_hari: 2.0, dosis_per_minum: '1', waktu_minum: ['pagi', 'malam'], catatan_implementasi: 'Dua kali sehari. Umumnya pagi dan malam.', is_penting: false, is_aktif: true },
  { id: 'ap-3', kategori: 'latin', input_dokter: ['tds', 'ter die sumendus', 'tid', 't.i.d.', 't.d.s.'], format_standar: '3x1', frekuensi_hari: 3.0, dosis_per_minum: '1', waktu_minum: ['pagi', 'siang', 'malam'], catatan_implementasi: 'Tiga kali sehari. Paling umum ditulis dokter Indonesia.', is_penting: true, is_aktif: true },
  { id: 'ap-4', kategori: 'latin', input_dokter: ['qid', 'quater in die', 'q.i.d.'], format_standar: '4x1', frekuensi_hari: 4.0, dosis_per_minum: '1', waktu_minum: ['pagi', 'siang', 'sore', 'malam'], catatan_implementasi: 'Empat kali sehari, interval kurang lebih 6 jam.', is_penting: false, is_aktif: true },
  { id: 'ap-5', kategori: 'latin', input_dokter: ['q4h', 'q.4.h.', 'setiap 4 jam'], format_standar: 'q4h', frekuensi_hari: 6.0, dosis_per_minum: '1', waktu_minum: ['interval'], catatan_implementasi: 'Setiap 4 jam termasuk malam. Penting untuk antibiotik level-dependent.', is_penting: true, is_aktif: true },
  { id: 'ap-6', kategori: 'latin', input_dokter: ['q6h', 'q.6.h.', 'setiap 6 jam'], format_standar: 'q6h', frekuensi_hari: 4.0, dosis_per_minum: '1', waktu_minum: ['interval'], catatan_implementasi: 'Setiap 6 jam. Setara qid tapi dengan penekanan interval ketat.', is_penting: false, is_aktif: true },
  { id: 'ap-7', kategori: 'latin', input_dokter: ['q8h', 'q.8.h.', 'setiap 8 jam'], format_standar: 'q8h', frekuensi_hari: 3.0, dosis_per_minum: '1', waktu_minum: ['interval'], catatan_implementasi: 'Setiap 8 jam. Setara tds tapi interval lebih ketat (contoh: antibiotik).', is_penting: true, is_aktif: true },
  { id: 'ap-8', kategori: 'latin', input_dokter: ['q12h', 'q.12.h.', 'setiap 12 jam'], format_standar: 'q12h', frekuensi_hari: 2.0, dosis_per_minum: '1', waktu_minum: ['interval'], catatan_implementasi: 'Setiap 12 jam. Lebih ketat dari bd — biasanya untuk antibiotik atau obat level darah.', is_penting: false, is_aktif: true },
  { id: 'ap-9', kategori: 'latin', input_dokter: ['prn', 'p.r.n.', 'k/p', 'kalau perlu', 'bila perlu', 'jika perlu'], format_standar: 'prn', frekuensi_hari: 0.0, dosis_per_minum: '1', waktu_minum: ['prn'], catatan_implementasi: 'Kondisional. Biasanya disertai kondisi dan batas maksimal dosis/hari.', is_penting: true, is_aktif: true },
  { id: 'ap-10', kategori: 'latin', input_dokter: ['sos', 'si opus sit', 's.o.s.'], format_standar: 'sos', frekuensi_hari: 0.0, dosis_per_minum: '1', waktu_minum: ['prn'], catatan_implementasi: 'Mirip prn tapi hanya sekali. Jika tidak membaik, hentikan atau ganti.', is_penting: false, is_aktif: true },
  { id: 'ap-11', kategori: 'latin', input_dokter: ['stat', 's.t.a.t.', 'segera', 'sekarang'], format_standar: 'stat', frekuensi_hari: 1.0, dosis_per_minum: '1', waktu_minum: ['stat'], catatan_implementasi: 'Berikan segera saat itu juga. Untuk dosis loading atau kondisi darurat.', is_penting: true, is_aktif: true },
  { id: 'ap-12', kategori: 'latin', input_dokter: ['ac', 'ante cibum', 'sebelum makan', 'a.c.'], format_standar: 'ac', frekuensi_hari: null, dosis_per_minum: null, waktu_minum: ['sebelum-makan'], catatan_implementasi: 'Modifikasi WAKTU, bukan frekuensi. Dikombinasikan: tds ac = 3x1 sebelum makan.', is_penting: true, is_aktif: true },
  { id: 'ap-13', kategori: 'latin', input_dokter: ['pc', 'post cibum', 'setelah makan', 'sesudah makan', 'p.c.'], format_standar: 'pc', frekuensi_hari: null, dosis_per_minum: null, waktu_minum: ['makan'], catatan_implementasi: 'Modifikasi WAKTU. tds pc = 3x1 setelah makan. Paling umum di Indonesia.', is_penting: true, is_aktif: true },
  { id: 'ap-14', kategori: 'latin', input_dokter: ['hs', 'hora somni', 'sebelum tidur', 'menjelang tidur', 'h.s.'], format_standar: 'hs', frekuensi_hari: 1.0, dosis_per_minum: '1', waktu_minum: ['tidur'], catatan_implementasi: 'Satu kali, saat akan tidur malam. Untuk statin, antihistamin, hipnotik.', is_penting: true, is_aktif: true },
  { id: 'ap-15', kategori: 'latin', input_dokter: ['mane', 'pagi hari', 'pagi'], format_standar: 'mane', frekuensi_hari: 1.0, dosis_per_minum: '1', waktu_minum: ['pagi'], catatan_implementasi: 'Sekali sehari, pagi hari. Untuk diuretik, kortikosteroid (ikuti ritme kortisol).', is_penting: true, is_aktif: true },
  { id: 'ap-16', kategori: 'latin', input_dokter: ['nocte', 'malam hari', 'malam'], format_standar: 'nocte', frekuensi_hari: 1.0, dosis_per_minum: '1', waktu_minum: ['malam'], catatan_implementasi: 'Sekali sehari, malam hari. Untuk statin (efek optimal malam), beberapa antihipertensi.', is_penting: true, is_aktif: true },

  /* ── ANGKA INDONESIA ── */
  { id: 'ap-17', kategori: 'indo', input_dokter: ['3x1', '3 x 1', '3×1'], format_standar: '3x1', frekuensi_hari: 3.0, dosis_per_minum: '1 tab', waktu_minum: ['pagi', 'siang', 'malam'], catatan_implementasi: 'Format paling umum di Indonesia. Tiga kali sehari satu tablet.', is_penting: true, is_aktif: true },
  { id: 'ap-18', kategori: 'indo', input_dokter: ['2x1', '2 x 1', '2×1'], format_standar: '2x1', frekuensi_hari: 2.0, dosis_per_minum: '1 tab', waktu_minum: ['pagi', 'malam'], catatan_implementasi: 'Dua kali sehari satu tablet.', is_penting: true, is_aktif: true },
  { id: 'ap-19', kategori: 'indo', input_dokter: ['1x1', '1 x 1', '1×1'], format_standar: '1x1', frekuensi_hari: 1.0, dosis_per_minum: '1 tab', waktu_minum: ['bebas'], catatan_implementasi: 'Sekali sehari satu tablet. Biasanya diikuti keterangan waktu.', is_penting: true, is_aktif: true },
  { id: 'ap-20', kategori: 'indo', input_dokter: ['4x1', '4 x 1'], format_standar: '4x1', frekuensi_hari: 4.0, dosis_per_minum: '1 tab', waktu_minum: ['pagi', 'siang', 'sore', 'malam'], catatan_implementasi: 'Empat kali sehari.', is_penting: false, is_aktif: true },
  { id: 'ap-21', kategori: 'indo', input_dokter: ['3x2', '3 x 2'], format_standar: '3x2', frekuensi_hari: 3.0, dosis_per_minum: '2 tab', waktu_minum: ['pagi', 'siang', 'malam'], catatan_implementasi: 'Tiga kali sehari DUA tablet. Perhatikan dosis total.', is_penting: true, is_aktif: true },
  { id: 'ap-22', kategori: 'indo', input_dokter: ['2x2', '2 x 2'], format_standar: '2x2', frekuensi_hari: 2.0, dosis_per_minum: '2 tab', waktu_minum: ['pagi', 'malam'], catatan_implementasi: 'Dua kali sehari dua tablet.', is_penting: false, is_aktif: true },
  { id: 'ap-23', kategori: 'indo', input_dokter: ['3x½', '3x1/2', '3 x ½'], format_standar: '3x½', frekuensi_hari: 3.0, dosis_per_minum: '½ tab', waktu_minum: ['pagi', 'siang', 'malam'], catatan_implementasi: 'Tiga kali sehari setengah tablet. Umum untuk antihipertensi dosis rendah.', is_penting: true, is_aktif: true },
  { id: 'ap-24', kategori: 'indo', input_dokter: ['2x½', '2x1/2', '2 x ½'], format_standar: '2x½', frekuensi_hari: 2.0, dosis_per_minum: '½ tab', waktu_minum: ['pagi', 'malam'], catatan_implementasi: 'Dua kali sehari setengah tablet.', is_penting: false, is_aktif: true },
  { id: 'ap-25', kategori: 'indo', input_dokter: ['1x½', '1x1/2'], format_standar: '1x½', frekuensi_hari: 1.0, dosis_per_minum: '½ tab', waktu_minum: ['bebas'], catatan_implementasi: 'Sekali sehari setengah tablet.', is_penting: false, is_aktif: true },
  { id: 'ap-26', kategori: 'indo', input_dokter: ['1x1 malam', '1x1 nocte', 'sekali malam'], format_standar: '1x1 (malam)', frekuensi_hari: 1.0, dosis_per_minum: '1 tab', waktu_minum: ['malam'], catatan_implementasi: 'Sekali sehari khusus malam. Untuk statin, antihistamin.', is_penting: true, is_aktif: true },
  { id: 'ap-27', kategori: 'indo', input_dokter: ['1x1 pagi', '1x1 mane'], format_standar: '1x1 (pagi)', frekuensi_hari: 1.0, dosis_per_minum: '1 tab', waktu_minum: ['pagi'], catatan_implementasi: 'Sekali sehari khusus pagi. Untuk diuretik, levotiroksin.', is_penting: true, is_aktif: true },

  /* ── POLA X-Y-Z ── */
  { id: 'ap-28', kategori: 'pola', input_dokter: ['1-1-1'], format_standar: '3x1 (pagi-siang-malam)', frekuensi_hari: 3.0, dosis_per_minum: '1-1-1', waktu_minum: ['pagi', 'siang', 'malam'], catatan_implementasi: 'Pagi 1, siang 1, malam 1. Setara 3x1 dengan jadwal jelas.', is_penting: true, is_aktif: true },
  { id: 'ap-29', kategori: 'pola', input_dokter: ['1-0-1'], format_standar: '2x1 (pagi-malam)', frekuensi_hari: 2.0, dosis_per_minum: '1-0-1', waktu_minum: ['pagi', 'malam'], catatan_implementasi: 'Pagi 1, siang tidak, malam 1. BERBEDA dari 2x1 — eksplisit tidak ada siang.', is_penting: true, is_aktif: true },
  { id: 'ap-30', kategori: 'pola', input_dokter: ['1-0-0'], format_standar: '1x1 (pagi)', frekuensi_hari: 1.0, dosis_per_minum: '1-0-0', waktu_minum: ['pagi'], catatan_implementasi: 'Pagi saja. Untuk diuretik, kortikosteroid.', is_penting: true, is_aktif: true },
  { id: 'ap-31', kategori: 'pola', input_dokter: ['0-0-1'], format_standar: '1x1 (malam)', frekuensi_hari: 1.0, dosis_per_minum: '0-0-1', waktu_minum: ['malam'], catatan_implementasi: 'Malam saja. Untuk statin, hipnotik.', is_penting: true, is_aktif: true },
  { id: 'ap-32', kategori: 'pola', input_dokter: ['1-1-0'], format_standar: '2x1 (pagi-siang)', frekuensi_hari: 2.0, dosis_per_minum: '1-1-0', waktu_minum: ['pagi', 'siang'], catatan_implementasi: 'Pagi dan siang saja, tidak malam. Untuk obat yang menyebabkan insomnia jika malam.', is_penting: true, is_aktif: true },
  { id: 'ap-33', kategori: 'pola', input_dokter: ['0-1-1'], format_standar: '2x1 (siang-malam)', frekuensi_hari: 2.0, dosis_per_minum: '0-1-1', waktu_minum: ['siang', 'malam'], catatan_implementasi: 'Siang dan malam, tidak pagi.', is_penting: false, is_aktif: true },
  { id: 'ap-34', kategori: 'pola', input_dokter: ['½-0-½', '1/2-0-1/2'], format_standar: '2x½ (pagi-malam)', frekuensi_hari: 2.0, dosis_per_minum: '½-0-½', waktu_minum: ['pagi', 'malam'], catatan_implementasi: 'Setengah tablet pagi, tidak siang, setengah malam. Untuk titrasi dosis.', is_penting: true, is_aktif: true },
  { id: 'ap-35', kategori: 'pola', input_dokter: ['1-0-½', '1-0-1/2'], format_standar: 'pagi 1, malam ½', frekuensi_hari: 2.0, dosis_per_minum: '1-0-½', waktu_minum: ['pagi', 'malam'], catatan_implementasi: 'Asimetris — pagi full dose, malam half dose. Contoh: warfarin, beberapa antihipertensi.', is_penting: true, is_aktif: true },
  { id: 'ap-36', kategori: 'pola', input_dokter: ['2-1-2'], format_standar: 'pagi 2, siang 1, malam 2', frekuensi_hari: 3.0, dosis_per_minum: '2-1-2', waktu_minum: ['pagi', 'siang', 'malam'], catatan_implementasi: 'Dosis tidak seragam. Perlu dicatat per waktu di label farmasi.', is_penting: false, is_aktif: true },
  { id: 'ap-37', kategori: 'pola', input_dokter: ['1-1-1-1'], format_standar: '4x1', frekuensi_hari: 4.0, dosis_per_minum: '1-1-1-1', waktu_minum: ['pagi', 'siang', 'sore', 'malam'], catatan_implementasi: 'Empat kali sehari dengan pola eksplisit.', is_penting: false, is_aktif: true },

  /* ── PENULISAN BEBAS ── */
  { id: 'ap-38', kategori: 'bebas', input_dokter: ['sekali sehari', 'once daily', 'once a day'], format_standar: '1x1', frekuensi_hari: 1.0, dosis_per_minum: '1', waktu_minum: ['bebas'], catatan_implementasi: 'Perlu klarifikasi waktu jika relevan.', is_penting: false, is_aktif: true },
  { id: 'ap-39', kategori: 'bebas', input_dokter: ['dua kali sehari', 'twice daily', 'twice a day'], format_standar: '2x1', frekuensi_hari: 2.0, dosis_per_minum: '1', waktu_minum: ['pagi', 'malam'], catatan_implementasi: '', is_penting: false, is_aktif: true },
  { id: 'ap-40', kategori: 'bebas', input_dokter: ['tiga kali sehari', 'three times daily'], format_standar: '3x1', frekuensi_hari: 3.0, dosis_per_minum: '1', waktu_minum: ['pagi', 'siang', 'malam'], catatan_implementasi: '', is_penting: false, is_aktif: true },
  { id: 'ap-41', kategori: 'bebas', input_dokter: ['selang sehari', 'every other day', 'dua hari sekali'], format_standar: 'q48h', frekuensi_hari: 0.5, dosis_per_minum: '1', waktu_minum: ['bebas'], catatan_implementasi: 'Setiap 2 hari. Untuk kortikosteroid jangka panjang atau beberapa obat reumatik.', is_penting: true, is_aktif: true },
  { id: 'ap-42', kategori: 'bebas', input_dokter: ['seminggu sekali', 'once weekly', 'tiap minggu'], format_standar: 'q1w', frekuensi_hari: 0.14, dosis_per_minum: '1', waktu_minum: ['bebas'], catatan_implementasi: 'Satu kali seminggu. Untuk metotreksat, bisfosfonat, suplemen tertentu.', is_penting: true, is_aktif: true },
  { id: 'ap-43', kategori: 'bebas', input_dokter: ['sebulan sekali', 'once monthly'], format_standar: 'q1mo', frekuensi_hari: 0.03, dosis_per_minum: '1', waktu_minum: ['bebas'], catatan_implementasi: 'Satu kali sebulan. Untuk bisfosfonat IV, beberapa kontrasepsi.', is_penting: false, is_aktif: true },
  { id: 'ap-44', kategori: 'bebas', input_dokter: ['setiap ... jam', 'tiap ... jam'], format_standar: 'qXh', frekuensi_hari: null, dosis_per_minum: '1', waktu_minum: ['interval'], catatan_implementasi: 'Interval ketat. Nilai X harus diisi: q4h, q6h, q8h, q12h.', is_penting: true, is_aktif: true },
  { id: 'ap-45', kategori: 'bebas', input_dokter: ['kalau nyeri', 'bila demam', 'jika sesak', 'sesuai kebutuhan'], format_standar: 'prn (+ kondisi)', frekuensi_hari: 0.0, dosis_per_minum: '1', waktu_minum: ['prn'], catatan_implementasi: 'PRN dengan kondisi trigger. Sistem harus capture kondisi dan batas dosis.', is_penting: true, is_aktif: true },
  { id: 'ap-46', kategori: 'bebas', input_dokter: ['loading dose lalu ...', 'dosis awal ... kemudian ...'], format_standar: 'loading + maintenance', frekuensi_hari: null, dosis_per_minum: 'var', waktu_minum: ['stat', 'makan'], catatan_implementasi: 'Dua fase: dosis awal lebih tinggi, lanjut dosis maintenance. Perlu dua baris di resep.', is_penting: true, is_aktif: true },
  { id: 'ap-47', kategori: 'bebas', input_dokter: ['tappering', 'tapering off', 'turunkan bertahap'], format_standar: 'tapering', frekuensi_hari: null, dosis_per_minum: 'var', waktu_minum: ['bebas'], catatan_implementasi: 'Dosis diturunkan bertahap. Perlu jadwal per minggu di catatan resep.', is_penting: true, is_aktif: true },

  /* ── OBAT KHUSUS ── */
  { id: 'ap-48', kategori: 'khusus', input_dokter: ['X IU malam', 'X unit/hari', 'sliding scale'], format_standar: 'sesuai jadwal insulin', frekuensi_hari: null, dosis_per_minum: 'var IU', waktu_minum: ['malam', 'prn'], catatan_implementasi: 'Insulin basal: malam hari. Sliding scale: berdasarkan GDS. Perlu skema terpisah.', is_penting: true, is_aktif: true },
  { id: 'ap-49', kategori: 'khusus', input_dokter: ['1 puff bd', '2 puff tid', '1 semprot ...'], format_standar: 'X puff Xkali', frekuensi_hari: null, dosis_per_minum: 'puff', waktu_minum: ['bebas'], catatan_implementasi: 'Inhaler: dosis dalam puff/semprot, bukan tablet. Sertakan teknik inhalasi di catatan.', is_penting: true, is_aktif: true },
  { id: 'ap-50', kategori: 'khusus', input_dokter: ['1 tetes OD bd', '2 tetes OU tds', 'gtt OD/OS/OU'], format_standar: 'X tetes OD/OS/OU', frekuensi_hari: null, dosis_per_minum: 'tetes', waktu_minum: ['bebas'], catatan_implementasi: 'OD=mata kanan, OS=mata kiri, OU=kedua mata. Gtt=guttae=tetes.', is_penting: true, is_aktif: true },
  { id: 'ap-51', kategori: 'khusus', input_dokter: ['oleskan tipis', 'ue', 'usus externus', 'topical bd'], format_standar: 'topikal Xkali', frekuensi_hari: null, dosis_per_minum: 'tipis', waktu_minum: ['bebas'], catatan_implementasi: 'Salep/krim: oleskan tipis di area yang sakit. ue = untuk pemakaian luar.', is_penting: false, is_aktif: true },
  { id: 'ap-52', kategori: 'khusus', input_dokter: ['1 suppos rektal', '1 suppositoria', 'supp k/p'], format_standar: '1 suppos rektal prn', frekuensi_hari: 0.0, dosis_per_minum: '1 suppos', waktu_minum: ['prn'], catatan_implementasi: 'Suppositoria rektal. Biasanya PRN untuk demam tinggi atau mual pasca operasi.', is_penting: false, is_aktif: true },
  { id: 'ap-53', kategori: 'khusus', input_dokter: ['nebulisasi q4h', 'nebu tid'], format_standar: 'nebulisasi Xkali', frekuensi_hari: null, dosis_per_minum: '1 nebulisasi', waktu_minum: ['interval'], catatan_implementasi: 'Obat nebulisasi: frekuensi sama tapi rute berbeda. Perlu instruksi alat.', is_penting: false, is_aktif: true }
];

export default function MasterObatPage() {
  const [activeTab, setActiveTab] = useState<'zat-aktif' | 'produk' | 'stok' | 'harga' | 'interaksi' | 'aturan-pakai'>('zat-aktif');
  
  // Data lists
  const [zatAktifList, setZatAktifList] = useState(DUMMY_ZAT_AKTIF);
  const [productList, setProductList] = useState(DUMMY_PRODUCTS);
  const [gudangList, setGudangList] = useState(DUMMY_GUDANG);
  const [stokList, setStokList] = useState(DUMMY_STOK);
  const [hargaList, setHargaList] = useState(DUMMY_HARGA);
  const [interaksiList, setInteraksiList] = useState(DUMMY_INTERAKSI);
  const [aturanPakaiList, setAturanPakaiList] = useState<any[]>(DUMMY_ATURAN_PAKAI);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Aturan Pakai specific state
  const [aturanPakaiFilter, setAturanPakaiFilter] = useState<'semua' | 'latin' | 'indo' | 'pola' | 'bebas' | 'khusus'>('semua');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    latin: false,
    indo: false,
    pola: false,
    bebas: false,
    khusus: false
  });

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Parser Tester State
  const [parserInput, setParserInput] = useState('');
  const [parserResult, setParserResult] = useState<any>(null);

  // Modal creation states
  const [showZatAktifModal, setShowZatAktifModal] = useState(false);
  const [showProdukModal, setShowProdukModal] = useState(false);
  const [showStokModal, setShowStokModal] = useState(false);
  const [showHargaModal, setShowHargaModal] = useState(false);
  const [showInteraksiModal, setShowInteraksiModal] = useState(false);
  const [showAturanPakaiModal, setShowAturanPakaiModal] = useState(false);

  // Form Fields
  const [formZatAktif, setFormZatAktif] = useState({
    nama_generik: '',
    kode_atc: '',
    kelas_terapi: 'Antibiotik',
    subkelas_terapi: '',
    golongan_obat: 'Keras',
    kontraindikasi_kehamilan: 'B',
    perlu_penyesuaian_ginjal: false,
    perlu_penyesuaian_hepar: false,
    frekuensi_default: '3x1',
    waktu_minum_default: 'pc',
    is_formularium_nas: false
  });

  const [formProduk, setFormProduk] = useState({
    zat_aktif_id: 'za-1',
    nama_dagang: '',
    kekuatan_dosis: '',
    bentuk_sediaan: 'Tablet',
    rute_pemberian: 'oral',
    satuan_terkecil: 'tablet',
    isi_per_kemasan: 10,
    produsen: '',
    no_registrasi_bpom: '',
    tipe_produk: 'branded-generik',
    is_bpjs: true,
    is_formularium_rs: true,
    prioritas_substitusi: 1
  });

  const [formStok, setFormStok] = useState({
    produk_id: 'prod-1',
    gudang_id: 'wh-1',
    stok_tersedia: 100,
    stok_minimum: 20,
    no_batch: 'BT-NEW2026',
    expired_date: '2028-12-31',
    lokasi_rak: 'RAK-A1'
  });

  const [formHarga, setFormHarga] = useState({
    produk_id: 'prod-1',
    jenis_jaminan: 'umum',
    harga_satuan: 1000,
    harga_kemasan: 10000,
    is_e_katalog: false,
    berlaku_dari: '2026-01-01'
  });

  const [formInteraksi, setFormInteraksi] = useState({
    zat_aktif_a_id: 'za-1',
    zat_aktif_b_id: 'za-2',
    tingkat_keparahan: 'major',
    efek_klinis: '',
    rekomendasi: '',
    sumber_referensi: 'Drugs.com',
    is_alergi_silang: false,
    berlaku_untuk_kelas: false
  });

  const [formAturanPakai, setFormAturanPakai] = useState({
    kategori: 'latin',
    input_dokter: '',
    format_standar: '',
    frekuensi_hari: '3',
    dosis_per_minum: '1 tab',
    waktu_minum: 'makan',
    catatan_implementasi: '',
    is_penting: false
  });

  // Action CRUD Operations
  const handleAddZatAktif = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `za-${Date.now()}`;
    const newRecord = {
      id: newId,
      ...formZatAktif,
      nama_alias: [formZatAktif.nama_generik.substring(0, 5)],
      dosis_lazim_dewasa: 'Sesuai petunjuk dokter',
      dosis_lazim_anak: 'N/A',
      dosis_max_harian: 1000,
      is_aktif: true
    };
    setZatAktifList([newRecord, ...zatAktifList]);
    setShowZatAktifModal(false);
  };

  const handleAddProduk = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `prod-${Date.now()}`;
    const newRecord = {
      id: newId,
      ...formProduk,
      nama_produk_lengkap: `${formProduk.nama_dagang} ${formProduk.kekuatan_dosis} ${formProduk.bentuk_sediaan}`,
      is_aktif: true
    };
    setProductList([newRecord, ...productList]);
    setShowProdukModal(false);
  };

  const handleAddStok = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `stk-${Date.now()}`;
    const newRecord = {
      id: newId,
      ...formStok
    };
    setStokList([newRecord, ...stokList]);
    setShowStokModal(false);
  };

  const handleAddHarga = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `prc-${Date.now()}`;
    const newRecord = {
      id: newId,
      ...formHarga,
      berlaku_sampai: null
    };
    setHargaList([newRecord, ...hargaList]);
    setShowHargaModal(false);
  };

  const handleAddInteraksi = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `int-${Date.now()}`;
    const newRecord = {
      id: newId,
      ...formInteraksi
    };
    setInteraksiList([newRecord, ...interaksiList]);
    setShowInteraksiModal(false);
  };

  const handleAddAturanPakai = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `ap-${Date.now()}`;
    const newRecord = {
      id: newId,
      kategori: formAturanPakai.kategori,
      input_dokter: formAturanPakai.input_dokter.split(',').map(s => s.trim().toLowerCase()),
      format_standar: formAturanPakai.format_standar,
      frekuensi_hari: formAturanPakai.frekuensi_hari ? parseFloat(formAturanPakai.frekuensi_hari) : null,
      dosis_per_minum: formAturanPakai.dosis_per_minum || null,
      waktu_minum: [formAturanPakai.waktu_minum],
      catatan_implementasi: formAturanPakai.catatan_implementasi,
      is_penting: formAturanPakai.is_penting,
      is_aktif: true
    };
    setAturanPakaiList([newRecord, ...aturanPakaiList]);
    setShowAturanPakaiModal(false);
    // Reset Form
    setFormAturanPakai({
      kategori: 'latin',
      input_dokter: '',
      format_standar: '',
      frekuensi_hari: '3',
      dosis_per_minum: '1 tab',
      waktu_minum: 'makan',
      catatan_implementasi: '',
      is_penting: false
    });
  };

  const handleDeleteZatAktif = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan Zat Aktif ini?')) {
      setZatAktifList(zatAktifList.map(za => za.id === id ? { ...za, is_aktif: false } : za));
    }
  };

  const handleDeleteProduk = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan Produk ini?')) {
      setProductList(productList.map(p => p.id === id ? { ...p, is_aktif: false } : p));
    }
  };

  const handleDeleteStok = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan stok ini?')) {
      setStokList(stokList.filter(s => s.id !== id));
    }
  };

  const handleDeleteHarga = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan tarif jaminan ini?')) {
      setHargaList(hargaList.filter(h => h.id !== id));
    }
  };

  const handleDeleteInteraksi = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus interaksi keselamatan obat ini?')) {
      setInteraksiList(interaksiList.filter(i => i.id !== id));
    }
  };

  const handleDeleteAturanPakai = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus aturan pakai ini?')) {
      setAturanPakaiList(aturanPakaiList.filter(a => a.id !== id));
    }
  };

  // Run Realtime Parser interpreter logic
  useEffect(() => {
    if (!parserInput) {
      setParserResult(null);
      return;
    }

    const query = parserInput.trim().toLowerCase();
    
    // Find matching rule in dummy list
    const matched = aturanPakaiList.find(rule => 
      rule.input_dokter.some((variant: string) => variant === query || query.includes(variant))
    );

    if (matched) {
      setParserResult({
        isValid: true,
        freq: matched.frekuensi_hari === null ? 'Modif Waktu' : matched.frekuensi_hari === 0 ? 'prn / Kondisional' : `${matched.frekuensi_hari}× / hari`,
        dose: matched.dosis_per_minum || '—',
        timing: matched.waktu_minum.join(', '),
        std: matched.format_standar,
        note: matched.catatan_implementasi
      });
    } else {
      setParserResult({
        isValid: false,
        freq: 'tidak dikenal',
        dose: '—',
        timing: '—',
        std: 'perlu klarifikasi',
        note: 'Format instruksi tidak dikenali sistem. Farmasi perlu konfirmasi ulang dengan dokter penulis resep.'
      });
    }
  }, [parserInput, aturanPakaiList]);

  return (
    <MasterLayout>
      <div className="space-y-6">
        
        {/* ================= HEADER BAR ================= */}
        <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950/40 p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/60 text-[10px] font-extrabold tracking-wide text-red-700 mb-3 shadow-2xs">
              <span>💊</span> MASTER FARMASI & CLINICAL SAFETY
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">Portal Kendali Master Obat HNZ</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Pusat konfigurasi master data farmasi. Kelola zat aktif generik, merek produk dagang, ketersediaan inventori fisik di apotek, tarif harga jaminan, serta database drug-drug interactions.
            </p>
          </div>

          <div className="relative z-10 self-start md:self-center shrink-0">
            {activeTab === 'zat-aktif' && (
              <button onClick={() => setShowZatAktifModal(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-red-500/10 active:scale-95 cursor-pointer transition-all">
                ➕ Zat Aktif Baru
              </button>
            )}
            {activeTab === 'produk' && (
              <button onClick={() => setShowProdukModal(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-red-500/10 active:scale-95 cursor-pointer transition-all">
                ➕ Produk Obat Baru
              </button>
            )}
            {activeTab === 'stok' && (
              <button onClick={() => setShowStokModal(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-red-500/10 active:scale-95 cursor-pointer transition-all">
                ➕ Catatan Stok Baru
              </button>
            )}
            {activeTab === 'harga' && (
              <button onClick={() => setShowHargaModal(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-red-500/10 active:scale-95 cursor-pointer transition-all">
                ➕ Tarif Jaminan Baru
              </button>
            )}
            {activeTab === 'interaksi' && (
              <button onClick={() => setShowInteraksiModal(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-red-500/10 active:scale-95 cursor-pointer transition-all">
                ➕ Alert Interaksi Baru
              </button>
            )}
            {activeTab === 'aturan-pakai' && (
              <button onClick={() => setShowAturanPakaiModal(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-red-500/10 active:scale-95 cursor-pointer transition-all">
                ➕ Aturan Pakai Baru
              </button>
            )}
          </div>
        </div>

        {/* ================= CONTROLLER TABS SELECTOR ================= */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner animate-fade-in">
          {[
            { id: 'zat-aktif', label: '🧪 Zat Aktif / Generik' },
            { id: 'produk', label: '📦 Produk Obat (Brand)' },
            { id: 'stok', label: '🏪 Inventori & Stok' },
            { id: 'harga', label: '💰 Tarif Jaminan' },
            { id: 'interaksi', label: '⚠️ Interaksi Keselamatan' },
            { id: 'aturan-pakai', label: '📜 Aturan Pakai (Sig.)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer text-center min-w-[140px] duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/10 scale-[1.01]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= SEARCH FILTER BAR ================= */}
        <div className="flex bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs items-center gap-3">
          <span className="text-slate-400 text-sm pl-2">🔍</span>
          <input
            type="text"
            placeholder={`Cari master data ${activeTab.replace('-', ' ')} berdasarkan kata kunci...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-medium text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-2 py-1.5 rounded-md cursor-pointer">
              X Bersihkan
            </button>
          )}
        </div>

        {/* ================= MAIN SHEET GRID DISPLAY ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 animate-fade-in">
          
          {/* --- SUB-TAB 1: ZAT AKTIF --- */}
          {activeTab === 'zat-aktif' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-900 mb-4 border-b border-slate-100 pb-3">🧬 Daftar Zat Aktif Kimia & Dosis Aman</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zatAktifList
                  .filter(za => za.nama_generik.toLowerCase().includes(searchTerm.toLowerCase()) || za.kode_atc.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(za => (
                    <div key={za.id} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-2xs ${
                      za.is_aktif ? 'bg-slate-50/40 border-slate-200' : 'bg-slate-100/40 border-slate-200 opacity-60'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase bg-red-50 border border-red-150 text-red-700 px-2 py-0.5 rounded-md">
                            ATC Code: {za.kode_atc}
                          </span>
                          <span className={`text-[8px] font-extrabold px-2 py-1 rounded-md uppercase ${
                            za.is_aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {za.is_aktif ? 'AKTIF' : 'NON-AKTIF'}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 mt-3">{za.nama_generik}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Alias: {za.nama_alias.join(', ')}</p>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-500 border-t border-slate-100 pt-3">
                          <div> kelas terapi: <strong className="text-slate-800 block">{za.kelas_terapi}</strong></div>
                          <div> golongan: <strong className="text-slate-800 block">{za.golongan_obat}</strong></div>
                          <div> kehamilan: <span className="font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">{za.kontraindikasi_kehamilan}</span></div>
                          <div> frekuensi: <strong className="text-slate-800 block">{za.frekuensi_default} ({za.waktu_minum_default})</strong></div>
                        </div>
                      </div>

                      {za.is_aktif && (
                        <div className="border-t border-slate-100 pt-3 mt-4 text-right">
                          <button onClick={() => handleDeleteZatAktif(za.id)} className="text-[10px] text-red-600 hover:text-red-550 font-extrabold border border-red-200 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 cursor-pointer transition-all active:scale-95">
                            🗑️ Matikan Zat
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* --- SUB-TAB 2: PRODUK OBAT (BRAND) --- */}
          {activeTab === 'produk' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-900 mb-4 border-b border-slate-100 pb-3">📦 Daftar Brand Produk Dagang Farmasi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productList
                  .filter(p => p.nama_dagang.toLowerCase().includes(searchTerm.toLowerCase()) || p.nama_produk_lengkap.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(p => {
                    const zat = zatAktifList.find(za => za.id === p.zat_aktif_id);
                    return (
                      <div key={p.id} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-2xs ${
                        p.is_aktif ? 'bg-slate-50/40 border-slate-200' : 'bg-slate-100/40 border-slate-200 opacity-60'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-md">
                              BPOM: {p.no_registrasi_bpom}
                            </span>
                            <span className={`text-[8px] font-extrabold px-2 py-1 rounded-md uppercase ${
                              p.is_aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {p.is_aktif ? 'AKTIF' : 'NON-AKTIF'}
                            </span>
                          </div>

                          <h3 className="text-sm font-black text-slate-900 mt-3">{p.nama_produk_lengkap}</h3>
                          <p className="text-[10px] text-slate-400 mt-1">Zat Aktif: <strong>{zat ? zat.nama_generik : 'Tidak Teridentifikasi'}</strong></p>

                          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-500 border-t border-slate-100 pt-3">
                            <div> kekuatan: <strong className="text-slate-800 block">{p.kekuatan_dosis}</strong></div>
                            <div> sediaan / rute: <strong className="text-slate-800 block">{p.bentuk_sediaan} / {p.rute_pemberian}</strong></div>
                            <div> kemasan / strip: <strong className="text-slate-800 block">Isi {p.isi_per_kemasan} {p.satuan_terkecil}</strong></div>
                            <div> produsen: <strong className="text-slate-800 block">{p.produsen}</strong></div>
                          </div>
                        </div>

                        {p.is_aktif && (
                          <div className="border-t border-slate-100 pt-3 mt-4 text-right">
                            <button onClick={() => handleDeleteProduk(p.id)} className="text-[10px] text-red-600 hover:text-red-550 font-extrabold border border-red-200 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 cursor-pointer transition-all active:scale-95">
                              Matikan Produk
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* --- SUB-TAB 3: STOK & INVENTORI --- */}
          {activeTab === 'stok' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-900 mb-4 border-b border-slate-100 pb-3">🏪 Realtime Monitoring Stok Gudang Farmasi</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-[10px] font-black text-slate-200 uppercase tracking-widest border-b border-slate-700">
                      <th className="py-4 px-6 rounded-l-2xl">Nama Produk / Obat</th>
                      <th className="py-4 px-6">Lokasi Gudang</th>
                      <th className="py-4 px-6">Stok Tersedia</th>
                      <th className="py-4 px-6">Stok Minimum</th>
                      <th className="py-4 px-6">No. Batch / Expired</th>
                      <th className="py-4 px-6">Lokasi Rak</th>
                      <th className="py-4 px-6 text-right rounded-r-2xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stokList.map(s => {
                      const prod = productList.find(p => p.id === s.produk_id);
                      const wh = gudangList.find(w => w.id === s.gudang_id);
                      const isLowStock = s.stok_tersedia <= s.stok_minimum;
                      return (
                        <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all font-medium text-slate-700">
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-slate-900 block">{prod ? prod.nama_produk_lengkap : 'Obat Unknown'}</span>
                          </td>
                          <td className="py-4 px-6 font-semibold">{wh ? wh.nama_gudang : 'Unknown Warehouse'}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-extrabold ${
                              isLowStock ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {s.stok_tersedia} {prod ? prod.satuan_terkecil : 'unit'}
                            </span>
                          </td>
                          <td className="py-4 px-6">{s.stok_minimum}</td>
                          <td className="py-4 px-6">
                            <span className="font-bold block text-indigo-700">{s.no_batch}</span>
                            <span className="text-[10px] text-slate-400">{s.expired_date}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold">{s.lokasi_rak}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button onClick={() => handleDeleteStok(s.id)} className="text-[10px] text-red-650 hover:text-red-550 font-bold border border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg bg-white cursor-pointer active:scale-95 transition-all">
                              🗑️ Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- SUB-TAB 4: TARIF JAMINAN --- */}
          {activeTab === 'harga' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-900 mb-4 border-b border-slate-100 pb-3">💰 Skema Tarif Harga Obat Multi Jaminan</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-[10px] font-black text-slate-200 uppercase tracking-widest border-b border-slate-700">
                      <th className="py-4 px-6 rounded-l-2xl">Nama Produk / Obat</th>
                      <th className="py-4 px-6">Jenis Jaminan / Asuransi</th>
                      <th className="py-4 px-6">Harga Satuan</th>
                      <th className="py-4 px-6">Harga Kemasan</th>
                      <th className="py-4 px-6">e-Katalog LKPP</th>
                      <th className="py-4 px-6 text-right rounded-r-2xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hargaList.map(h => {
                      const prod = productList.find(p => p.id === h.produk_id);
                      return (
                        <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all font-medium text-slate-700">
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-slate-900 block">{prod ? prod.nama_produk_lengkap : 'Obat Unknown'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase">
                              {h.jenis_jaminan}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold">Rp {h.harga_satuan.toLocaleString('id-ID')}</td>
                          <td className="py-4 px-6 font-bold">Rp {h.harga_kemasan.toLocaleString('id-ID')}</td>
                          <td className="py-4 px-6">{h.is_e_katalog ? '✅ Ya' : '❌ Tidak'}</td>
                          <td className="py-4 px-6 text-right">
                            <button onClick={() => handleDeleteHarga(h.id)} className="text-[10px] text-red-600 hover:text-red-550 font-bold border border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg bg-white cursor-pointer active:scale-95 transition-all">
                              🗑️ Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- SUB-TAB 5: KEAMANAN INTERAKSI --- */}
          {activeTab === 'interaksi' && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-900 mb-4 border-b border-slate-100 pb-3">⚠️ Database Kontraindikasi & Bahaya Interaksi Obat</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {interaksiList.map(int => {
                  const zaA = zatAktifList.find(z => z.id === int.zat_aktif_a_id);
                  const zaB = zatAktifList.find(z => z.id === int.zat_aktif_b_id);
                  return (
                    <div key={int.id} className="relative overflow-hidden bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
                      <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                        int.tingkat_keparahan === 'major' ? 'bg-red-600' : 'bg-amber-500'
                      }`} />
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            int.tingkat_keparahan === 'major' ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {int.tingkat_keparahan} risk alert
                          </span>
                          <span className="text-[10px] text-slate-400">Ref: {int.sumber_referensi}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-xs font-black text-slate-900">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-1.5 rounded-lg">{zaA ? zaA.nama_generik : 'Substance A'}</span>
                          <span className="text-red-500">❌</span>
                          <span className="bg-slate-100 border border-slate-200 px-2 py-1.5 rounded-lg">{zaB ? zaB.nama_generik : 'Substance B'}</span>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Efek Klinis:</span>
                            <p className="text-[11px] font-medium text-slate-700 leading-relaxed mt-1">{int.efek_klinis}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Tindakan Rekomendasi Medis:</span>
                            <p className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl leading-relaxed mt-1">{int.rekomendasi}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 mt-5 flex items-center justify-end">
                        <button onClick={() => handleDeleteInteraksi(int.id)} className="text-[10px] text-red-600 hover:text-red-550 font-bold border border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg bg-white cursor-pointer active:scale-95 transition-all">
                          🗑️ Hapus Alert
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'aturan-pakai' && (
            <div className="space-y-4">
              {/* ================= LEGEND & FILTER CHIPS ================= */}
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-450 uppercase tracking-widest">Jenis Notasi:</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700">Singkatan Latin Medis</span>
                      <span className="inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded bg-emerald-50 border border-emerald-250 text-emerald-700">Angka Indonesia (X×Y)</span>
                      <span className="inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">Pola X-Y-Z</span>
                      <span className="inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-purple-700">Penulisan Bebas</span>
                      <span className="inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded bg-red-50 border border-red-200 text-red-700">Notasi Khusus</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                    ⚡ Total: {aturanPakaiList.length} entri terdaftar
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-450 uppercase tracking-widest shrink-0">Saring Kategori:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'semua', label: '🌍 Semua Notasi' },
                      { id: 'latin', label: '🔬 Singkatan Latin' },
                      { id: 'indo', label: '🇮🇩 Angka Indonesia' },
                      { id: 'pola', label: '📊 Pola X-Y-Z' },
                      { id: 'bebas', label: '✍️ Penulisan Bebas' },
                      { id: 'khusus', label: '⚕️ Notasi Khusus' }
                    ].map(chip => (
                      <button
                        key={chip.id}
                        onClick={() => setAturanPakaiFilter(chip.id as any)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                          aturanPakaiFilter === chip.id
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/10'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/60'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ================= DATABASE SIG MASTER GRID ================= */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-900 mb-2">📜 Mapping Standarisasi Aturan Pakai (Sig.)</h2>
                
                {[
                  { id: 'latin', label: 'Notasi Latin / Singkatan Medis', icon: '🔬', bg: 'bg-blue-50/50 border-blue-200 text-blue-800' },
                  { id: 'indo', label: 'Notasi Angka Indonesia (X×Y)', icon: '🇮🇩', bg: 'bg-emerald-50/50 border-emerald-250 text-emerald-800' },
                  { id: 'pola', label: 'Pola X-Y-Z (Indonesia — Khas)', icon: '📊', bg: 'bg-amber-50/50 border-amber-200 text-amber-800' },
                  { id: 'bebas', label: 'Penulisan Bebas / Campuran', icon: '✍️', bg: 'bg-purple-50/50 border-purple-200 text-purple-800' },
                  { id: 'khusus', label: 'Notasi Khusus Per Jenis Obat', icon: '⚕️', bg: 'bg-red-50/50 border-red-200 text-red-800' }
                ].map(section => {
                  // Skip if active filter doesn't include this category
                  if (aturanPakaiFilter !== 'semua' && aturanPakaiFilter !== section.id) return null;

                  // Filter items matching current category and search term
                  const categoryItems = aturanPakaiList.filter(rule => {
                    if (rule.kategori !== section.id) return false;
                    const matchesSearch = searchTerm === '' || 
                      rule.format_standar.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      rule.input_dokter.some((v: string) => v.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      rule.catatan_implementasi.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesSearch;
                  });

                  const isCollapsed = collapsedCategories[section.id] ?? false;

                  return (
                    <div key={section.id} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleCategoryCollapse(section.id)}
                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/60 border-b border-slate-200/60 cursor-pointer select-none transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black border ${section.bg}`}>
                            {section.icon}
                          </span>
                          <span className="text-xs font-black text-slate-800">{section.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                            {categoryItems.length} entri
                          </span>
                          <span className="text-xs text-slate-400 font-bold transition-transform duration-200">
                            {isCollapsed ? '▼' : '▲'}
                          </span>
                        </div>
                      </div>

                      {/* Accordion Content Table */}
                      {!isCollapsed && (
                        <div className="overflow-x-auto">
                          {categoryItems.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 font-medium">
                              Tidak ada entri aturan pakai pada kategori ini yang cocok dengan pencarian Anda.
                            </div>
                          ) : (
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-800/5 text-[9px] font-black text-slate-450 uppercase tracking-widest border-b border-slate-200/60">
                                  <th className="py-3.5 px-6" style={{ width: '220px' }}>Input Dokter (Varian)</th>
                                  <th className="py-3.5 px-6" style={{ width: '130px' }}>Format Standar</th>
                                  <th className="py-3.5 px-6" style={{ width: '100px' }}>Freq / Hari</th>
                                  <th className="py-3.5 px-6" style={{ width: '110px' }}>Dosis per Minum</th>
                                  <th className="py-3.5 px-6" style={{ width: '150px' }}>Waktu Minum</th>
                                  <th className="py-3.5 px-6">Catatan Implementasi Farmasi</th>
                                  <th className="py-3.5 px-6 text-right" style={{ width: '90px' }}>Aksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryItems.map(rule => (
                                  <tr key={rule.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-all font-medium text-slate-700">
                                    <td className="py-4 px-6">
                                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                                        {rule.input_dokter.map((v: string) => (
                                          <span key={v} className="font-mono text-[10px] font-bold bg-white border border-slate-250 px-2 py-0.5 rounded text-slate-800 shadow-3xs">{v}</span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="py-4 px-6">
                                      <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 border border-emerald-250 text-emerald-700 uppercase">
                                        {rule.format_standar}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6">
                                      {rule.frekuensi_hari === null ? (
                                        <span className="text-slate-400 font-bold italic">modif waktu</span>
                                      ) : rule.frekuensi_hari === 0 ? (
                                        <span className="text-amber-600 font-black bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">prn / kp</span>
                                      ) : (
                                        <span className="font-extrabold text-slate-900">{rule.frekuensi_hari}× / hari</span>
                                      )}
                                    </td>
                                    <td className="py-4 px-6 font-bold">{rule.dosis_per_minum || '—'}</td>
                                    <td className="py-4 px-6">
                                      <div className="flex flex-wrap gap-1">
                                        {rule.waktu_minum.map((t: string) => {
                                          let timeCls = 'bg-slate-50 border-slate-200 text-slate-600';
                                          if (t === 'pagi') timeCls = 'bg-amber-50 border-amber-200 text-amber-700';
                                          if (t === 'siang') timeCls = 'bg-sky-50 border-sky-250 text-sky-700';
                                          if (t === 'malam') timeCls = 'bg-indigo-50 border-indigo-250 text-indigo-700';
                                          if (t === 'tidur') timeCls = 'bg-violet-50 border-violet-200 text-violet-750';
                                          if (t === 'makan' || t === 'sebelum-makan') timeCls = 'bg-emerald-50 border-emerald-250 text-emerald-700';
                                          if (t === 'prn') timeCls = 'bg-orange-50 border-orange-200 text-orange-700';
                                          if (t === 'stat') timeCls = 'bg-red-50 border-red-250 text-red-700';

                                          return (
                                            <span key={t} className={`inline-flex text-[9px] font-black border px-2 py-0.5 rounded uppercase ${timeCls}`}>
                                              {t}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="py-4 px-6 text-slate-500 max-w-xs leading-relaxed text-[11px]">
                                      {rule.is_penting && <span className="text-red-500 font-bold" title="Critical Instruction">⚑ </span>}
                                      {rule.catatan_implementasi}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                      <button 
                                        onClick={() => handleDeleteAturanPakai(rule.id)} 
                                        className="text-[10px] text-red-600 hover:text-red-550 font-bold border border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg bg-white cursor-pointer active:scale-95 transition-all"
                                      >
                                        🗑️ Hapus
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ================= MODAL - ADD ZAT AKTIF ================= */}
      {showZatAktifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-red-600 to-red-700 text-white flex justify-between items-center">
              <h3 className="font-black text-sm">🧪 Tambah Master Zat Aktif / Generik</h3>
              <button onClick={() => setShowZatAktifModal(false)} className="text-white hover:text-slate-200 font-black text-base cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddZatAktif} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nama Generik WHO *</label>
                <input required type="text" placeholder="Contoh: Amoxicillin Trihydrate" value={formZatAktif.nama_generik} onChange={(e) => setFormZatAktif({...formZatAktif, nama_generik: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kode ATC WHO *</label>
                  <input required type="text" placeholder="Contoh: J01CA04" value={formZatAktif.kode_atc} onChange={(e) => setFormZatAktif({...formZatAktif, kode_atc: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Golongan Obat *</label>
                  <select value={formZatAktif.golongan_obat} onChange={(e) => setFormZatAktif({...formZatAktif, golongan_obat: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                    <option value="Bebas">Bebas</option>
                    <option value="Bebas Terbatas">Bebas Terbatas</option>
                    <option value="Keras">Keras (Resep)</option>
                    <option value="Psikotropika">Psikotropika</option>
                    <option value="Narkotika">Narkotika</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kelas Terapi *</label>
                  <input required type="text" placeholder="Contoh: Antibiotik" value={formZatAktif.kelas_terapi} onChange={(e) => setFormZatAktif({...formZatAktif, kelas_terapi: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kontraindikasi Hamil *</label>
                  <select value={formZatAktif.kontraindikasi_kehamilan} onChange={(e) => setFormZatAktif({...formZatAktif, kontraindikasi_kehamilan: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                    <option value="A">Kategori A (Aman)</option>
                    <option value="B">Kategori B (Cukup Aman)</option>
                    <option value="C">Kategori C (Gunakan dengan Perhatian)</option>
                    <option value="D">Kategori D (Risiko Terbukti)</option>
                    <option value="X">Kategori X (KONTRAINDIKASI FATAL)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={formZatAktif.perlu_penyesuaian_ginjal} onChange={(e) => setFormZatAktif({...formZatAktif, perlu_penyesuaian_ginjal: e.target.checked})} className="h-4.5 w-4.5 rounded border-slate-300 text-red-600" />
                  Cek Ginjal (eGFR)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={formZatAktif.perlu_penyesuaian_hepar} onChange={(e) => setFormZatAktif({...formZatAktif, perlu_penyesuaian_hepar: e.target.checked})} className="h-4.5 w-4.5 rounded border-slate-300 text-red-600" />
                  Cek Fungsi Hepar
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Prefill Frekuensi</label>
                  <input type="text" placeholder="3x1" value={formZatAktif.frekuensi_default} onChange={(e) => setFormZatAktif({...formZatAktif, frekuensi_default: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Prefill Waktu Minum</label>
                  <select value={formZatAktif.waktu_minum_default} onChange={(e) => setFormZatAktif({...formZatAktif, waktu_minum_default: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                    <option value="ac">ac (Sebelum Makan)</option>
                    <option value="pc">pc (Setelah Makan)</option>
                    <option value="hs">hs (Sebelum Tidur / Malam)</option>
                    <option value="bebas">bebas (Kapan Saja)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowZatAktifModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer">Batal</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/10 cursor-pointer">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL - ADD PRODUCT ================= */}
      {showProdukModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex justify-between items-center">
              <h3 className="font-black text-sm">📦 Tambah Master Produk Obat (Brand)</h3>
              <button onClick={() => setShowProdukModal(false)} className="text-white hover:text-slate-200 font-black text-base cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddProduk} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pilih Zat Aktif / Generik *</label>
                <select value={formProduk.zat_aktif_id} onChange={(e) => setFormProduk({...formProduk, zat_aktif_id: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                  {zatAktifList.map(za => (
                    <option key={za.id} value={za.id}>{za.nama_generik} ({za.kode_atc})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nama Dagang (Brand) *</label>
                  <input required type="text" placeholder="Contoh: Amoxan" value={formProduk.nama_dagang} onChange={(e) => setFormProduk({...formProduk, nama_dagang: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kekuatan Dosis *</label>
                  <input required type="text" placeholder="Contoh: 500mg" value={formProduk.kekuatan_dosis} onChange={(e) => setFormProduk({...formProduk, kekuatan_dosis: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sediaan *</label>
                  <select value={formProduk.bentuk_sediaan} onChange={(e) => setFormProduk({...formProduk, bentuk_sediaan: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-red-500">
                    <option value="Tablet">Tablet</option>
                    <option value="Kapsul">Kapsul</option>
                    <option value="Sirup">Sirup</option>
                    <option value="Injeksi">Injeksi</option>
                    <option value="Tetes">Tetes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Rute *</label>
                  <select value={formProduk.rute_pemberian} onChange={(e) => setFormProduk({...formProduk, rute_pemberian: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-red-500">
                    <option value="oral">Oral</option>
                    <option value="IV">Intravena (IV)</option>
                    <option value="IM">Intramuskular (IM)</option>
                    <option value="topikal">Topikal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Satuan Kecil *</label>
                  <input required type="text" placeholder="kapsul/tablet" value={formProduk.satuan_terkecil} onChange={(e) => setFormProduk({...formProduk, satuan_terkecil: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Isi per Pack/Strip *</label>
                  <input required type="number" value={formProduk.isi_per_kemasan} onChange={(e) => setFormProduk({...formProduk, isi_per_kemasan: parseInt(e.target.value)})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Produsen / Industri *</label>
                  <input required type="text" placeholder="Contoh: Sanbe Farma" value={formProduk.produsen} onChange={(e) => setFormProduk({...formProduk, produsen: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={formProduk.is_bpjs} onChange={(e) => setFormProduk({...formProduk, is_bpjs: e.target.checked})} className="h-4.5 w-4.5 rounded border-slate-300 text-red-650" />
                  Bisa Klaim BPJS
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={formProduk.is_formularium_rs} onChange={(e) => setFormProduk({...formProduk, is_formularium_rs: e.target.checked})} className="h-4.5 w-4.5 rounded border-slate-300 text-red-650" />
                  Masuk Formularium RS
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowProdukModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer">Batal</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/10 cursor-pointer">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL - ADD STOCK ================= */}
      {showStokModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex justify-between items-center">
              <h3 className="font-black text-sm">🏪 Tambah Catatan Inventori / Stok Apotek</h3>
              <button onClick={() => setShowStokModal(false)} className="text-white hover:text-slate-200 font-black text-base cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddStok} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pilih Produk Obat *</label>
                <select value={formStok.produk_id} onChange={(e) => setFormStok({...formStok, produk_id: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                  {productList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama_produk_lengkap}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pilih Lokasi Gudang/Apotek *</label>
                <select value={formStok.gudang_id} onChange={(e) => setFormStok({...formStok, gudang_id: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                  {gudangList.map(g => (
                    <option key={g.id} value={g.id}>{g.nama_gudang}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Stok Tersedia *</label>
                  <input required type="number" value={formStok.stok_tersedia} onChange={(e) => setFormStok({...formStok, stok_tersedia: parseInt(e.target.value)})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Threshold Minimum *</label>
                  <input required type="number" value={formStok.stok_minimum} onChange={(e) => setFormStok({...formStok, stok_minimum: parseInt(e.target.value)})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowStokModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer">Batal</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/10 cursor-pointer">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL - ADD PRICE ================= */}
      {showHargaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex justify-between items-center">
              <h3 className="font-black text-sm">💰 Tambah Catatan Skema Tarif Jaminan</h3>
              <button onClick={() => setShowHargaModal(false)} className="text-white hover:text-slate-200 font-black text-base cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddHarga} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pilih Produk Obat *</label>
                <select value={formHarga.produk_id} onChange={(e) => setFormHarga({...formHarga, produk_id: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                  {productList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama_produk_lengkap}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Jenis Jaminan Pasien *</label>
                <select value={formHarga.jenis_jaminan} onChange={(e) => setFormHarga({...formHarga, jenis_jaminan: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                  <option value="umum">Umum Mandiri</option>
                  <option value="bpjs">💚 BPJS Kesehatan</option>
                  <option value="asuransi_a">🏢 Asuransi Swasta Premium</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Harga Satuan (Rp) *</label>
                  <input required type="number" value={formHarga.harga_satuan} onChange={(e) => setFormHarga({...formHarga, harga_satuan: parseFloat(e.target.value)})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Harga Kemasan (Rp) *</label>
                  <input required type="number" value={formHarga.harga_kemasan} onChange={(e) => setFormHarga({...formHarga, harga_kemasan: parseFloat(e.target.value)})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowHargaModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer">Batal</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/10 cursor-pointer">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL - ADD INTERACTION ================= */}
      {showInteraksiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex justify-between items-center">
              <h3 className="font-black text-sm">⚠️ Tambah Aturan Interaksi & Keamanan Obat</h3>
              <button onClick={() => setShowInteraksiModal(false)} className="text-white hover:text-slate-200 font-black text-base cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddInteraksi} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Zat Aktif Pertama *</label>
                  <select value={formInteraksi.zat_aktif_a_id} onChange={(e) => setFormInteraksi({...formInteraksi, zat_aktif_a_id: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                    {zatAktifList.map(za => (
                      <option key={za.id} value={za.id}>{za.nama_generik}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Zat Aktif Kedua *</label>
                  <select value={formInteraksi.zat_aktif_b_id} onChange={(e) => setFormInteraksi({...formInteraksi, zat_aktif_b_id: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                    {zatAktifList.map(za => (
                      <option key={za.id} value={za.id}>{za.nama_generik}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Deskripsi Manifestasi Efek Klinis *</label>
                <textarea required rows={3} placeholder="Apa efek berbahaya yang terjadi..." value={formInteraksi.efek_klinis} onChange={(e) => setFormInteraksi({...formInteraksi, efek_klinis: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Rekomendasi Tindakan Medis *</label>
                <textarea required rows={3} placeholder="Apa rekomendasi tindakan penanganannya..." value={formInteraksi.rekomendasi} onChange={(e) => setFormInteraksi({...formInteraksi, rekomendasi: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowInteraksiModal(false)} className="rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer">Batal</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/10 cursor-pointer">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL - ADD ATURAN PAKAI ================= */}
      {showAturanPakaiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex justify-between items-center">
              <h3 className="font-black text-sm">📜 Tambah Standard Aturan Pakai (Sig.)</h3>
              <button onClick={() => setShowAturanPakaiModal(false)} className="text-white hover:text-slate-200 font-black text-base cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddAturanPakai} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Notasi Kategori *</label>
                  <select value={formAturanPakai.kategori} onChange={(e) => setFormAturanPakai({...formAturanPakai, kategori: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500">
                    <option value="latin">Notasi Latin Medis</option>
                    <option value="indo">Angka Indonesia (X×Y)</option>
                    <option value="pola">Pola X-Y-Z (Khas)</option>
                    <option value="bebas">Penulisan Bebas / Campuran</option>
                    <option value="khusus">Kondisi Khusus per Jenis Obat</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Format Standar EMR *</label>
                  <input required type="text" placeholder="Contoh: 3x1, q8h, prn" value={formAturanPakai.format_standar} onChange={(e) => setFormAturanPakai({...formAturanPakai, format_standar: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Input Dokter / Varian * (Pisahkan dengan koma)</label>
                <input required type="text" placeholder="Contoh: tds, ter die, t.i.d" value={formAturanPakai.input_dokter} onChange={(e) => setFormAturanPakai({...formAturanPakai, input_dokter: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
                <span className="text-[9px] text-slate-450 block mt-1">Variasi ejaan tulisan yang akan ditangkap autocomplete resep.</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Frekuensi / Hari</label>
                  <input type="number" step="0.01" placeholder="e.g. 3, 2, 0.5" value={formAturanPakai.frekuensi_hari} onChange={(e) => setFormAturanPakai({...formAturanPakai, frekuensi_hari: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Dosis per Minum</label>
                  <input type="text" placeholder="e.g. 1 tab, 1/2 tab" value={formAturanPakai.dosis_per_minum} onChange={(e) => setFormAturanPakai({...formAturanPakai, dosis_per_minum: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Waktu Minum</label>
                  <select value={formAturanPakai.waktu_minum} onChange={(e) => setFormAturanPakai({...formAturanPakai, waktu_minum: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-red-500">
                    <option value="bebas">Bebas</option>
                    <option value="pagi">Pagi</option>
                    <option value="siang">Siang</option>
                    <option value="malam">Malam</option>
                    <option value="makan">Sesudah Makan</option>
                    <option value="sebelum-makan">Sebelum Makan</option>
                    <option value="prn">Bila Perlu (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Catatan Implementasi E-Prescribing *</label>
                <textarea required rows={3} placeholder="Berikan keterangan detail panduan implementasi untuk farmasi..." value={formAturanPakai.catatan_implementasi} onChange={(e) => setFormAturanPakai({...formAturanPakai, catatan_implementasi: e.target.value})} className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-red-500" />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={formAturanPakai.is_penting} onChange={(e) => setFormAturanPakai({...formAturanPakai, is_penting: e.target.checked})} className="h-4.5 w-4.5 rounded border-slate-300 text-red-600" />
                  Aturan Penting (Tampilkan Icon Flag 🚨)
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAturanPakaiModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer">Batal</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/10 cursor-pointer">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </MasterLayout>
  );
}
