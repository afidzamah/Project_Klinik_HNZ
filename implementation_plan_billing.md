# Rencana Implementasi: Sistem Billing Pasien & Otomatisasi Tarif Pendaftaran

Rencana ini dibuat untuk mengimplementasikan skema database billing pasien tiga tingkat di Klinik HNZ dan mengintegrasikan logic otomatisasi pengisian tarif **Administrasi Pendaftaran** secara langsung ketika pasien menyelesaikan pendaftaran kunjungan baru.

---

## User Review Required

> [!IMPORTANT]
> - **Pembaruan Skema Database (Prisma)**:
>   - Menambahkan kolom `id_tindakan` dan `id_resep_item` pada tabel `tagihan_detail` agar dapat menunjuk referensi tindakan klinis atau obat farmasi.
>   - Membuat tabel baru `tagihan_detail_komponen` untuk mencatat pecahan biaya (*snapshot*) pada saat transaksi.
>   - Melakukan sinkronisasi ke PostgreSQL menggunakan perintah `npx prisma db push`.
> - **Otomatisasi Pendaftaran (Kunjungan)**:
>   - Pada saat kunjungan baru dibuat di pendaftaran (`KunjunganService.create`), sistem akan mendeteksi kelas perawatan default (`Rawat Jalan`) dan tindakan **`Administrasi Pendaftaran`** dari database.
>   - Sistem akan memuat tarif tindakan Administrasi Pendaftaran berdasarkan metode bayar yang dipilih (atau fallback ke `Umum Pribadi`).
>   - Transaksi baru di tabel `tagihan` (header invoice), `tagihan_detail` (item invoice), dan `tagihan_detail_komponen` (rincian pembagian nominal) akan dibuat secara otomatis secara transaksional.
>   - Nomor invoice akan dibuat secara urut menggunakan format `INV-[No Kunjungan]` (misal: `INV-2605230001`) agar secara visual langsung memetakan satu invoice ke satu kunjungan.

---

## Proposed Changes

### 1. Database Schema

#### [MODIFY] [schema.prisma](file:///d:/develop/Project_Klinik_HNZ/backend-klinik/prisma/schema.prisma)
* Memodifikasi model `tagihan_detail` untuk menambahkan kolom `id_tindakan`, `id_resep_item`, `created_at`, serta relasi ke `master_tindakan` dan `tagihan_detail_komponen[]`.
* Menambahkan model baru `tagihan_detail_komponen` di akhir file.
* Memperbarui model `master_tindakan` dan `master_komponen_tarif` untuk meregistrasikan relasi baru ke tabel detail billing.

---

### 2. Backend Logic (NestJS)

#### [MODIFY] [kunjungan.service.ts](file:///d:/develop/Project_Klinik_HNZ/backend-klinik/src/kunjungan/kunjungan.service.ts)
* Memperluas method `create(createKunjunganDto: any)` untuk memproses billing otomatis setelah data `kunjungan` berhasil disimpan ke database.
* **Alur Logika Otomatisasi:**
  1. Cari data tindakan **`Administrasi Pendaftaran`** di database.
  2. Cari kelas perawatan **`Rawat Jalan`** di database.
  3. Dapatkan tarif Administrasi Pendaftaran untuk kombinasi `[Rawat Jalan + id_cara_bayar]`. Jika tidak ditemukan, fallback ke `[Rawat Jalan + Umum Pribadi]`.
  4. Jika tarif ditemukan, buat record header `tagihan` baru dengan `no_invoice: 'INV-' + no_kunjungan`.
  5. Buat record `tagihan_detail` untuk mencatat tindakan Administrasi Pendaftaran tersebut dengan harga satuan sesuai master tarif.
  6. Pecah nominal tarif tersebut ke dalam komponen-komponennya dengan menyisipkan record ke `tagihan_detail_komponen` (misal Jasa Sarana: Rp 10.000, Jasa Perawat: Rp 5.000).

---

## Verification Plan

### Database & Compilation Verification
1. Jalankan `npx prisma db push` di folder `backend-klinik` untuk menerapkan perubahan skema.
2. Jalankan `npx prisma generate` untuk memperbarui tipe Prisma Client.
3. Jalankan `npm run build` di backend untuk memastikan tidak ada kesalahan kompilasi (*watch compilation* otomatis memverifikasi hal ini).

### Manual Functional Verification
1. Buka halaman Pendaftaran Pasien di [http://localhost:3001/pendaftaran](http://localhost:3001/pendaftaran).
2. Daftarkan kunjungan pasien baru (misalnya dengan metode pembayaran `Umum Pribadi`).
3. Setelah pendaftaran berhasil, buka halaman Input Tarif di [http://localhost:3001/tarif] (Tab 3: Daftar Rincian Tarif) atau akses database langsung.
4. Verifikasi bahwa **Invoice baru berformat `INV-YYMMDDXXXX`** telah dibuat otomatis secara realtime dengan total nominal Rp 15.000.
5. Verifikasi bahwa breakdown komponen biaya (Jasa Sarana: Rp 10.000 dan Jasa Perawat: Rp 5.000) terisi dengan sempurna di dalam rincian invoice pasien tersebut.
