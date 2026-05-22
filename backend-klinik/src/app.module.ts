import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PasienModule } from './pasien/pasien.module';
import { KunjunganModule } from './kunjungan/kunjungan.module';
import { AntreanModule } from './antrean/antrean.module';
import { AsesmenKeperawatanModule } from './asesmen-keperawatan/asesmen-keperawatan.module';
import { PemeriksaanDokterModule } from './pemeriksaan-dokter/pemeriksaan-dokter.module';
import { ResepModule } from './resep/resep.module';
import { TagihanModule } from './tagihan/tagihan.module';
import { MasterDokterModule } from './master-dokter/master-dokter.module';
import { MasterPoliklinikModule } from './master-poliklinik/master-poliklinik.module';
import { MasterJenisAlamatModule } from './master-jenis-alamat/master-jenis-alamat.module';
import { MasterProvinsiModule } from './master-provinsi/master-provinsi.module';
import { MasterKabupatenModule } from './master-kabupaten/master-kabupaten.module';
import { MasterKecamatanModule } from './master-kecamatan/master-kecamatan.module';
import { MasterKelurahanModule } from './master-kelurahan/master-kelurahan.module';
import { MasterWilayahModule } from './master-wilayah/master-wilayah.module';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from './auth/activity-log.interceptor';

@Module({
  imports: [
    PrismaModule, 
    AuthModule,
    PasienModule, 
    KunjunganModule, 
    AntreanModule, 
    AsesmenKeperawatanModule, 
    PemeriksaanDokterModule, 
    ResepModule, 
    TagihanModule, 
    MasterDokterModule, 
    MasterPoliklinikModule, 
    MasterJenisAlamatModule, 
    MasterProvinsiModule, 
    MasterKabupatenModule, 
    MasterKecamatanModule, 
    MasterKelurahanModule, 
    MasterWilayahModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    }
  ],
})
export class AppModule {}
