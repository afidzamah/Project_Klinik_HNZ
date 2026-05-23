import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const { method, url, body } = request;

    // Log only modifying methods (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isMutation || url.includes('/auth/login') || url.includes('/auth/logout') || url.includes('/auth/register')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (response) => {
          let session = request.session;
          let user = request.user;

          // Dynamically resolve session if not pre-populated by AuthGuard (backward-compatible)
          const authHeader = request.headers.authorization;
          if (!session && authHeader && authHeader.startsWith('Bearer ')) {
            try {
              const token = authHeader.split(' ')[1];
              const resolved = await this.authService.validateSession(token);
              if (resolved) {
                session = resolved;
                user = {
                  ...resolved.user,
                  nama_lengkap: resolved.user.pegawai?.nama_lengkap || '',
                  id_pegawai: resolved.user.pegawai?.id_pegawai || resolved.user.id_user,
                };
              }
            } catch (err) {
              console.error('Dynamic session resolution failed in interceptor:', err.message);
            }
          }

          if (session && session.id_sesi) {
            try {
              const idSesi = session.id_sesi;
              const pegawaiName = user?.nama_lengkap || 'Pegawai';
              const endpoint = `${method} ${url}`;
              
              // Generate human-friendly descriptions based on URL paths
              let deskripsi = `Melakukan aksi ${method} pada ${url}`;
              
              if (url.startsWith('/pasien')) {
                if (method === 'POST') {
                  deskripsi = `Mendaftarkan pasien baru bernama "${body.nama_lengkap || 'Tanpa Nama'}" dengan NIK ${body.nik || '-'}.`;
                } else if (method === 'PUT' || method === 'PATCH') {
                  deskripsi = `Mengubah data pasien "${body.nama_lengkap || 'Tanpa Nama'}" (ID: ${url.split('/').pop()}).`;
                }
              } else if (url.startsWith('/antrean')) {
                if (method === 'POST') {
                  deskripsi = `Membuat nomor antrean loket baru: ${response?.no_antrean || body.no_antrean || '-'}.`;
                } else if (url.includes('/panggil')) {
                  deskripsi = `Memanggil nomor antrean loket: ${response?.no_antrean || '-'}.`;
                }
              } else if (url.startsWith('/kunjungan')) {
                if (method === 'POST') {
                  deskripsi = `Mendaftarkan kunjungan pasien baru (No Kunjungan: ${response?.no_kunjungan || body.no_kunjungan || '-'}).`;
                }
              } else if (url.startsWith('/asesmen-keperawatan')) {
                if (method === 'POST') {
                  deskripsi = `Mengisi dan menyimpan asesmen awal keperawatan (Tensi: ${body.sistole}/${body.diastole}, Suhu: ${body.suhu_tubuh}°C).`;
                }
              } else if (url.startsWith('/pemeriksaan-dokter')) {
                if (method === 'POST') {
                  deskripsi = `Menyimpan rekam medis pemeriksaan SOAP Dokter Spesialis (Keluhan Utama: "${body.anamnesis_subjektif || '-'}").`;
                }
              } else if (url.startsWith('/resep')) {
                if (method === 'POST') {
                  deskripsi = `Membuat resep elektronik baru (No Resep: ${response?.no_resep || body.no_resep || '-'}).`;
                }
              } else if (url.startsWith('/tagihan')) {
                if (method === 'POST') {
                  deskripsi = `Menyelesaikan billing / transaksi tagihan kasir (Invoice: ${response?.no_invoice || body.no_invoice || '-'}, Total: Rp ${Number(response?.total_netto || body.total_netto || 0).toLocaleString('id-ID')}).`;
                }
              }

              // Save to activity logs asynchronously (without blocking request completion)
              await this.authService.logActivity(idSesi, endpoint, deskripsi);
            } catch (err) {
              console.error('Gagal menyimpan log aktivitas:', err.message);
            }
          }
        },
      })
    );
  }
}
