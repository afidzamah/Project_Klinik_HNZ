# Walkthrough: Modul Kasir & Billing Pasien Premium (Klinik HNZ)

Seluruh komponen untuk **Modul Kasir & Billing Pasien** telah selesai diimplementasikan secara komprehensif! Modul baru ini terintegrasi penuh mulai dari perluasan REST API backend (NestJS), sinkronisasi otomatis izin menu di database, penambahan navigasi menu di sidebar, hingga pembuatan antarmuka Kasir premium (Next.js) yang fungsional dan dinamis.

---

## 1. Perluasan REST API Backend (NestJS)

Dua pembaruan utama dilakukan pada modul tagihan (`backend-klinik/src/tagihan/`):
* **`GET /tagihan` (findAll)**: Diperbarui untuk mengikutsertakan model `tagihan_detail_komponen` di dalam relasi `tagihan_detail`. Ini memungkingkan kasir melihat rincian pecahan komponen biaya (Jasa Sarana, Jasa Medis, dll.) untuk setiap tindakan pasien secara *real-time*.
* **`PATCH /tagihan/:id/bayar` (bayar - BARU)**: Endpoint baru yang berfungsi memproses pembayaran invoice tagihan. Ketika dipanggil, sistem akan:
  1. Mengubah `status_bayar` menjadi `'Lunas'`.
  2. Merekam `metode_pembayaran` (seperti Tunai, Debit, QRIS, BPJS).
  3. Merekam nominal diskon (`total_diskon`) dan harga akhir setelah diskon (`total_netto`).
  4. Menetapkan waktu bayar (`waktu_bayar`).
  5. **Mengubah status `kunjungan` pasien menjadi `'Selesai'`** secara otomatis di database.

---

## 2. Pembaruan Hak Akses & Menu Sidebar

* **Seeder Peran (`auth.service.ts`)**: Izin menu baru `'/kasir'` telah didaftarkan ke dalam menu akses untuk role **`pendaftaran`**, **`farmasi`**, dan **`superadmin`** secara otomatis pada startup server.
* **Master Layout Sidebar (`MasterLayout.tsx`)**: 
  * Menu baru **`💵 Kasir & Billing Pasien`** (mengarah ke `/kasir`) resmi ditambahkan di sidebar.
  * Menu lama *Farmasi & Kasir* diubah labelnya menjadi **`💊 Apotek & Farmasi`** agar terjadi pemisahan tanggung jawab yang jelas antara bagian peracikan/penyerahan obat (Apoteker) dengan bagian pembayaran invoice (Kasir).

---

## 3. UI Kasir & Workspace Pembayaran Premium (`/kasir`)

Halaman baru `/kasir` dirancang dengan arsitektur **Split Panel** modern bergradasi warna klinik HNZ (Red-gradient) dan reaktivitas instan:

### A. Panel Kiri (Daftar Invoice Pasien)
* **Pencarian Real-Time**: Kolom pencarian untuk mencari invoice berdasarkan No. Invoice, No. Rekam Medis (RM), atau Nama Lengkap Pasien secara instan.
* **Filter Tab Status**:
  * ⏳ **Antrean Tagihan**: Menampilkan seluruh pasien yang baru mendaftar atau yang baru selesai diperiksa dokter dengan status invoice `'BELUM_BAYAR'`.
  * ✅ **Riwayat Lunas**: Menampilkan seluruh invoice pasien yang sudah berhasil dibayar lengkap dengan tombol cetak ulang kuitansi.

### B. Panel Kanan (Workspace Kasir & Kalkulator Pembayaran)
* **Informasi Pasien Lengkap**: Menampilkan No. Invoice, Nama Lengkap, dan No. RM pasien aktif yang dipilih.
* **Itemized Billing & Breakdown Komponen**:
  * Menampilkan baris demi baris layanan yang dibeli pasien (seperti tindakan pendaftaran, tindakan dokter, atau obat farmasi).
  * **Visualisasi Komponen Jasa**: Setiap tindakan secara transparan memunculkan rincian pecahan komponen biaya di bawahnya (misal Jasa Sarana, Jasa Perawat, BHP, Jasa Medis) untuk audit cost.
* **Kalkulator Pembayaran Real-Time**:
  * **Input Diskon**: Kotak input rupiah diskon yang secara instan memotong harga bruto dan memperbarui total bayar bersih (netto) di layar saat diketik.
  * **Metode Bayar**: Pilihan pembayaran (Tunai, Debit, Kredit, QRIS, BPJS, Asuransi).
  * **Uang Diterima & Kembalian**: Khusus metode Tunai, Kasir dapat mengetikkan jumlah uang tunai yang diterima dari pasien, dan **uang kembalian akan terhitung otomatis secara *real-time*** di layar sebelum menekan tombol proses.

### C. Modul Cetak Kuitansi Thermal Premium
* Ketika tombol **"PROSES PEMBAYARAN & CETAK STRUK"** diklik, invoice akan dilunasi di database, lalu memicu munculnya **HNZ Clinic Thermal Receipt Modal**.
* Struk didesain meniru printer thermal kasir rumah sakit asli: lengkap dengan nama & alamat klinik, detail invoice, detail item belanja, total bruto, diskon, netto, uang diterima, kembalian, barcode representasi estetik, dan doa *"Semoga Lekas Sembuh"*.
* Menyediakan tombol **"Cetak Fisik"** yang terhubung langsung ke dialog `window.print()` browser Anda.

---

## 4. Hasil Pengujian & Kompilasi

* **Backend Compilation**: Sukses 100% tanpa error, NestJS server aktif berjalan.
* **Frontend tsc Check**: Hasil pemeriksaan type safety (`npx tsc --noEmit` di `frontend-klinik`) lulus dengan status **0 errors / 0 warnings**.

---

## 5. Panduan Pengujian Langkah Demi Langkah

Mari kita uji alur pembayaran kasir ini secara langsung:

1. Buka halaman Pendaftaran Pasien di **[http://localhost:3001/pendaftaran](http://localhost:3001/pendaftaran)**.
2. Daftarkan pasien baru (misalnya dengan metode pembayaran `Umum Pribadi`).
3. Begitu pendaftaran selesai, buka menu baru di sidebar Anda: **`💵 Kasir & Billing Pasien`** (atau akses langsung ke **[http://localhost:3001/kasir](http://localhost:3001/kasir)**).
4. Di panel kiri di bawah tab **Antrean Tagihan**, Anda akan melihat pasien yang baru Anda daftarkan tersebut dengan total tagihan Rp 15.000.
5. Klik nama pasien tersebut untuk membuka Workspace Kasir di panel kanan.
6. **Periksa rincian item**: Anda akan melihat tindakan *"Administrasi Pendaftaran"* lengkap dengan rincian komponen biaya di bawahnya: *Jasa Sarana Rp 10.000* dan *Jasa Perawat Rp 5.000*.
7. Di bagian bawah, masukkan Diskon (misal `5000`). Lihat total bersih berubah dari Rp 15.000 menjadi **Rp 10.000** secara instan.
8. Pilih metode bayar `Tunai`, masukkan uang diterima (misal `50000`). Lihat uang kembalian terhitung **Rp 40.000** secara instan.
9. Tekan tombol merah **"PROSES PEMBAYARAN & CETAK STRUK"**.
10. **Boom!** Kuitansi thermal premium akan muncul di layar Anda. Anda dapat mencetaknya langsung atau menutupnya untuk kembali ke antrean kasir. Pasien tersebut kini otomatis berpindah ke tab **Riwayat Lunas**.
