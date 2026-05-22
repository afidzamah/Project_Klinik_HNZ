import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class PemeriksaanDokterService {
  private ai: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    // 🔍 DIAGNOSTIK 1: Cek apakah NestJS benar-benar bisa membaca file .env kamu
    console.log("🔑 KUNCI API DI .env YANG TERBACA NESTJS:", process.env.GEMINI_API_KEY);

    const cleanApiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
    this.ai = new GoogleGenAI({ apiKey: cleanApiKey });
  }

  async analisisDiagnosaAI(id_kunjungan: string, anamnesis_subjektif: string) {
    const asesmenPerawat = await this.prisma.asesmen_keperawatan.findFirst({
      where: { id_kunjungan },
      orderBy: { id_asesmen: 'desc' },
    });

    const keluhanAwal = asesmenPerawat?.keluhan_utama || 'Tidak ada catatan keluhan awal';
    const tensi = asesmenPerawat ? `${asesmenPerawat.sistole}/${asesmenPerawat.diastole} mmHg` : 'Tidak diperiksa';
    const suhu = asesmenPerawat ? `${asesmenPerawat.suhu_tubuh} °C` : 'Tidak diperiksa';
    const bb = asesmenPerawat ? `${asesmenPerawat.berat_badan} kg` : 'Tidak diperiksa';

    const promptMedis = `
      Anda adalah Sistem Pendukung Keputusan Klinis (CDSS) AI Internasional untuk Klinik Utama HNZ.
      Tugas Anda adalah memberikan rekomendasi diagnosis banding sementara berdasarkan data klinis pasien berikut.
      
      DATA KLINIS KEPERAWATAN:
      - Keluhan Awal Perawat: ${keluhanAwal}
      - Tanda Vital (TTV): Tensi: ${tensi}, Suhu: ${suhu}, Berat Badan: ${bb}
      
      ANAMNESIS SUBJEKTIF DOKTER:
      - Hasil Wawancara Dokter: ${anamnesis_subjektif}
      
      ATURAN OUTPUT:
      Wajib merespons HANYA dalam format JSON bersih tanpa markdown (\`\`\`), tanpa teks pembuka/penutup. Struktur JSON harus persis seperti ini:
      {
        "diagnosa_utama": "Nama Penyakit Utama Bahasa Indonesia",
        "icd10_utama": "Kode ICD-10",
        "diagnosa_banding": [
          { "penyakit": "Nama Penyakit Banding 1", "icd10": "Kode ICD-10", "probabilitas": "Persentase%" }
        ],
        "rekomendasi_tindakan": "Rencana terapi/pemeriksaan penunjang singkat",
        "edukasi_pasien": "Saran perawatan di rumah untuk pasien"
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptMedis,
      });

      const rawText = response.text || '';
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJsonText);
    } catch (error) {
      // 🔍 DIAGNOSTIK 2: Cetak eror asli dari Google ke terminal backend
      console.error("🔴 EROR NYATA DI TRY-CATCH GEMINI:", error);

      return {
        diagnosa_utama: "Gagal memproses diagnosis AI",
        icd10_utama: "-",
        diagnosa_banding: [],
        rekomendasi_tindakan: "Silakan lakukan diagnosis manual, koneksi API terganggu.",
        edukasi_pasien: "-"
      };
    }
  }

  async create(createDto: any) {
    return this.prisma.pemeriksaan_dokter.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.pemeriksaan_dokter.findMany({
      include: {
        kunjungan: {
          include: {
            pasien: true
          }
        }
      }
    });
  }
}