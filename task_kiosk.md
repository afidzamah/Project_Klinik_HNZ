# Checklist Implementasi Kiosk Mandiri Premium & UX NIK Pasien Lama

- `[x]` Desain Visual Kiosk Premium (Citra RS)
  - `[x]` Terapkan background gradient red-rose lembut yang mewah dan minimalis.
  - `[x]` Integrasikan widget Jam Digital dinamis & Tanggal Indonesia realtime terupdate tiap detik.
  - `[x]` Desain panel Beranda, Ambil Tiket, dan Numpad dengan style Glassmorphic & Shadow 2xl.
  - `[x]` Tambahkan efek hover dan micro-animations pada setiap tombol kartu menu.
- `[x]` Perbaikan UX Input NIK Pasien Lama
  - `[x]` Ubah tampilan input NIK statis menjadi elemen `<input>` HTML sesungguhnya untuk mendukung keyboard fisik dan virtual.
  - `[x]` Tambahkan fungsi Auto-Focus cursor otomatis menggunakan React `useRef` begitu layar "Pasien Lama" aktif.
  - `[x]` Implementasikan tombol `⌫ Hapus` (Backspace) pada Numpad virtual untuk menghapus 1 digit terakhir secara presisi.
  - `[x]` Tambahkan tombol `❌ RESET` untuk membersihkan seluruh inputan NIK secara instan.
  - `[x]` Terapkan refokus kursor otomatis setiap kali tombol virtual atau tombol hapus diklik.
- `[x]` Verifikasi Akhir & Kompilasi
  - `[x]` Pastikan type safety frontend Next.js 100% aman (0 errors).
  - `[x]` Jalankan server lokal Next.js dan uji visual di browser secara realtime.
  - `[x]` Buat laporan walkthrough hasil pengerjaan di `walkthrough_kiosk.md`.
