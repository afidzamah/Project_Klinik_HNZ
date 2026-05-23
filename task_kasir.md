# Checklist Implementasi Modul Kasir & Billing Pasien

- `[x]` Pembaruan REST API Backend (NestJS)
  - `[x]` Update method `findAll()` di `TagihanService` untuk menyertakan `tagihan_detail_komponen`.
  - `[x]` Tambahkan method `bayar()` di `TagihanService` untuk melunasi tagihan, menghitung diskon & netto, dan meng-update kunjungan pasien menjadi 'Selesai'.
  - `[x]` Registrasikan endpoint `PATCH /tagihan/:id/bayar` pada `TagihanController`.
- `[x]` Pembaruan Hak Akses Seeder & Sidebar Navigasi
  - `[x]` Daftarkan menu `'/kasir'` pada role `pendaftaran`, `farmasi`, dan `superadmin` di `auth.service.ts` agar menu Kasir muncul di sidebar.
  - `[x]` Daftarkan menu `💵 Kasir & Billing Pasien` di `MasterLayout.tsx` dan ubah label lama *Farmasi & Kasir* menjadi *Apotek & Farmasi*.
- `[x]` Pembuatan Halaman Kasir Frontend (`Next.js`)
  - `[x]` Buat file `page.tsx` di `frontend-klinik/src/app/kasir/page.tsx`.
  - `[x]` Desain **Panel Kiri (List Invoice)** dengan filter pencarian instan dan tab *Antrean Tagihan* vs *Riwayat Lunas*.
  - `[x]` Desain **Panel Kanan (Workspace Kasir)** dengan daftar item tindakan/obat lengkap dengan pecahan breakdown komponen biaya.
  - `[x]` Implementasikan **Kalkulator Real-Time** untuk potongan diskon, input uang diterima, dan hitung uang kembalian secara instan.
  - `[x]` Desain **Kuitansi Thermal Modal** premium dengan representasi barcode, informasi detail klinik/pasien, dan tombol cetak fisik browser.
- `[x]` Kompilasi & Verifikasi Akhir
  - `[x]` Pastikan NestJS server melakukan rekompilasi otomatis dengan sukses tanpa error (0 errors).
  - `[x]` Jalankan `npx tsc --noEmit` di `frontend-klinik` untuk memastikan type safety lengkap (0 errors).
  - `[x]` Buat laporan walkthrough hasil implementasi di `walkthrough_kasir.md`.
