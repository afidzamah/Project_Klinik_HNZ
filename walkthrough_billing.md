# Walkthrough: Sistem Billing Pasien & Otomatisasi Administrasi Pendaftaran (Klinik HNZ)

Seluruh komponen untuk fitur **Sistem Billing Pasien** tiga tingkat dan **Otomatisasi Tarif Administrasi Pendaftaran** telah selesai diimplementasikan secara komprehensif. Perubahan ini terintegrasi penuh mulai dari pembaruan skema database relasional (PostgreSQL via Prisma) hingga integrasi logic transaksional yang andal pada backend NestJS.

---

## 1. Pembaruan Skema Database (Prisma & PostgreSQL)

Tabel billing pasien telah dikembangkan menjadi struktur **Tiga Tingkat** yang aman untuk perekaman permanen (*transaction snapshotting*):

- **`tagihan` (Header)**: Menyimpan total bruto, diskon, netto, dan status pembayaran invoice (`BELUM_BAYAR`, `LUNAS`, `BATAL`).
- **`tagihan_detail` (Item/Layanan)**: Ditambahkan kolom `id_tindakan` dan `id_resep_item` untuk melacak asal tindakan medis atau obat dari farmasi secara opsional, namun tetap bertindak sebagai ledger kasir yang flat.
- **`tagihan_detail_komponen` (Snapshot Komponen - BARU)**: Tabel baru untuk memecah nominal item layanan kasir berdasarkan komponen tarifnya (seperti Jasa Sarana, Jasa Medis, BHP, Jasa Perawat) secara permanen pada saat transaksi dilakukan.

Perubahan skema ini telah disinkronisasikan ke PostgreSQL (`npx prisma db push`) dan Prisma Client telah diregenerasi (`npx prisma generate`) dengan sukses.

---

## 2. Implementasi Logic Otomatisasi (NestJS Backend)

Modifikasi dilakukan pada **`KunjunganService.create`** (`backend-klinik/src/kunjungan/kunjungan.service.ts`) menggunakan blok **`this.prisma.$transaction`** agar pembuatan kunjungan, pembuatan invoice, penginputan tindakan administrasi, beserta pecahan detail komponen biayanya berjalan secara ACID (aman, utuh, dan konsisten):

### Alur Kerja Otomatisasi Kasir:
1. **Pendaftaran Pasien Selesai**: Sistem menyimpan data `kunjungan` pasien baru.
2. **Pencarian Master Data**: Mencari tindakan master **`Administrasi Pendaftaran`** dan kelas **`Rawat Jalan`**.
3. **Pemuatan Tarif Real-Time**: Mencari tarif Administrasi Pendaftaran untuk kombinasi `[Rawat Jalan + cara_bayar_kunjungan]`. Jika tidak ada, sistem otomatis menggunakan *fallback* ke metode bayar default yaitu `Umum Pribadi`.
4. **Pembuatan Header Invoice**: Membuat record `tagihan` dengan format invoice **`INV-[No Kunjungan]`** (contoh: `INV-2605230001`) yang secara otomatis menyatukan relasi invoice ke kunjungan secara visual.
5. **Pencatatan Tindakan**: Menyisipkan tindakan Administrasi Pendaftaran ke `tagihan_detail` dengan harga satuan sesuai master tarif (Rp 15.000).
6. **Snapshot Komponen Biaya**: Secara otomatis menyalin pemecahan komponen master ke tabel `tagihan_detail_komponen`:
   * **`Jasa Sarana`** = **Rp 10.000**
   * **`Jasa Perawat`** = **Rp 5.000**
7. **Resiliensi Sistem**: Seluruh proses dibungkus dalam blok `try-catch` internal agar bila ada kendala master data tarif pendaftaran, pendaftaran kunjungan utama pasien **tetap berhasil diproses tanpa terhenti**, sambil mencatat log peringatan untuk administrator keuangan.

---

## 3. Hasil Verifikasi Sistem

* **NestJS Watch Compiler**: Sukses mendeteksi perubahan file, melakukan rekompilasi otomatis, dan memulai ulang NestJS server tanpa ada warning/error.
* **Next.js Frontend Compilation (Type Safety Check)**: Pengujian menggunakan `npx tsc --noEmit` di folder `frontend-klinik` selesai dengan status **0 errors / 0 warnings**, membuktikan integrasi skema database baru tidak merusak tipe data frontend.

---

## 4. Panduan Pengujian Manual

Anda dapat menguji fitur ini secara langsung melalui langkah mudah berikut:

1. Buka halaman Pendaftaran Pasien Klinik HNZ di **[http://localhost:3001/pendaftaran](http://localhost:3001/pendaftaran)**.
2. Daftarkan kunjungan pasien baru (lama atau baru) dengan cara bayar apa saja (misalnya `Umum Pribadi`).
3. Selesaikan pendaftaran hingga status antrean pasien masuk ke dalam list *Nurse Station*.
4. Buka halaman Input Tarif di **[http://localhost:3001/tarif](http://localhost:3001/tarif)**, lalu masuk ke **Tab 3: Input & Breakdown Tarif**.
5. Di tabel kanan **Daftar Rincian Tarif**, cari baris paling atas atau ketik nama pasien yang baru Anda daftarkan di kolom pencarian.
6. Anda akan melihat **Invoice baru berformat `INV-YYMMDDXXXX`** dengan total nominal **Rp 15.000** (Administrasi Pendaftaran) berstatus **`BELUM_BAYAR`**.
7. Klik baris invoice tersebut untuk melihat pemecahan biayanya: Anda akan mendapati komponen **Jasa Sarana: Rp 10.000** dan **Jasa Perawat: Rp 5.000** tercatat sempurna secara realtime!
