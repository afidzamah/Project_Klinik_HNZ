import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AsesmenKeperawatanService {
  private ai: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    const cleanApiKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
    this.ai = new GoogleGenAI({ apiKey: cleanApiKey });
  }

  private async generateContentWithFallback(options: { contents: any }) {
    const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
    let lastError: any = null;
    for (const model of models) {
      try {
        console.log(`[AsesmenKeperawatanService] Trying Gemini model: ${model}...`);
        const response = await this.ai.models.generateContent({
          model,
          contents: options.contents,
        });
        console.log(`[AsesmenKeperawatanService] Success with Gemini model: ${model}`);
        return response;
      } catch (err: any) {
        lastError = err;
        console.error(`[AsesmenKeperawatanService] Failed with Gemini model ${model}:`, err.message || err);
      }
    }
    throw lastError || new Error('All Gemini models failed to generate content.');
  }

  // 1. Fungsi Perawat Menginput Asesmen Awal
  async create(createAsesmenDto: any) {
    // Memastikan data kunjungan pasien tersebut benar-benar ada
    const kunjungan = await this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: createAsesmenDto.id_kunjungan },
    });

    if (!kunjungan) {
      throw new NotFoundException('Data kunjungan tidak ditemukan!');
    }

    // Menyimpan data asesmen TTV ke database
    return this.prisma.asesmen_keperawatan.create({
      data: {
        id_kunjungan: createAsesmenDto.id_kunjungan,
        // id_perawat: createAsesmenDto.id_perawat, // (Bisa diaktifkan jika tabel master perawat sudah ada)
        keluhan_utama: createAsesmenDto.keluhan_utama,
        sistole: createAsesmenDto.sistole,
        diastole: createAsesmenDto.diastole,
        suhu_tubuh: createAsesmenDto.suhu_tubuh,
        berat_badan: createAsesmenDto.berat_badan,
        tinggi_badan: createAsesmenDto.tinggi_badan,
        detak_jantung: createAsesmenDto.detak_jantung,
        respiratory_rate: createAsesmenDto.respiratory_rate,
        alergi_makanan: createAsesmenDto.alergi_makanan,
        alergi_obat: createAsesmenDto.alergi_obat,
        skala_nyeri: createAsesmenDto.skala_nyeri,
        skala_risiko_jatuh: createAsesmenDto.skala_risiko_jatuh,
        tingkat_risiko_jatuh: createAsesmenDto.tingkat_risiko_jatuh,
        obat_dikonsumsi: createAsesmenDto.obat_dikonsumsi,
        riwayat_penyakit: createAsesmenDto.riwayat_penyakit,
        spo2: createAsesmenDto.spo2,
        gds: createAsesmenDto.gds,
        waktu_periksa: new Date(),
      },
    });
  }

  // 2. Fungsi Melihat Daftar Asesmen (Beserta Data Kunjungannya)
  async findAll() {
    return this.prisma.asesmen_keperawatan.findMany({
      include: {
        kunjungan: true, 
      },
    });
  }

  // 3. AI Multimodal Lab Results PDF/Image Parser
  async parseLabPdf(base64Data: string, mimeType: string) {
    const prompt = `
      Anda adalah sistem AI ekstraksi data klinis laboratorium medis.
      Tugas Anda adalah membaca dokumen hasil laboratorium (bisa berupa PDF atau Gambar) dan mengekstrak datanya ke dalam format JSON bersih tanpa tanda kutip markdown (\`\`\`), tanpa teks penjelasan pembuka atau penutup.

      Struktur JSON yang wajib Anda hasilkan harus persis seperti ini:
      {
        "nama_rs": "Nama Rumah Sakit/Klinik yang tertera",
        "nama_pasien": "Nama Pasien lengkap",
        "tanggal_lab": "Tanggal Pemeriksaan/Selesai (format YYYY-MM-DD HH:mm:ss)",
        "no_registrasi": "Nomor Registrasi",
        "no_order": "Nomor Order/LIS",
        "daftar_pemeriksaan": [
          {
            "kategori": "Nama Kategori (misalnya: Hematologi Lengkap, Glukosa Sewaktu)",
            "nama_pemeriksaan": "Nama parameter pemeriksaan (misalnya: Eritrosit, Lekosit, CRP)",
            "hasil": "Nilai Hasil (misalnya: 4.69 atau 'Negatif')",
            "satuan": "Satuan hasil (misalnya: 10^6/uL, g/dL, %)",
            "nilai_normal": "Rentang nilai normal (misalnya: 4.20 - 6.00, < 5)",
            "flag": "Status abnormalitas jika ada, pilih salah satu: 'Normal', 'High', 'Low'"
          }
        ]
      }
    `;

    try {
      const response = await this.generateContentWithFallback({
        contents: [
          {
            inlineData: {
              data: base64Data.replace(/^data:[^;]+;base64,/, ''), // Strip out base64 prefixes if passed
              mimeType: mimeType || 'application/pdf',
            },
          },
          prompt,
        ],
      });

      const rawText = response.text || '';
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error("🔴 ERROR GEMINI PARSE LAB:", error);
      throw new Error("Gagal mengurai dokumen laboratorium via Gemini AI: " + error.message);
    }
  }

  // 4. Menyimpan data hasil laboratorium yang sudah divalidasi ke database
  async saveHasilLab(dto: any) {
    const kunjungan = await this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: dto.id_kunjungan },
    });

    if (!kunjungan) {
      throw new NotFoundException('Data kunjungan tidak ditemukan!');
    }

    const tanggal = dto.tanggal_lab ? new Date(dto.tanggal_lab) : new Date();

    return this.prisma.hasil_laboratorium.create({
      data: {
        id_kunjungan: dto.id_kunjungan,
        nama_rs: dto.nama_rs || 'Brawijaya Hospital',
        nama_pasien: dto.nama_pasien || '',
        tanggal_lab: tanggal,
        no_registrasi: dto.no_registrasi || '',
        no_order: dto.no_order || '',
        daftar_pemeriksaan: dto.daftar_pemeriksaan || [],
        catatan_analisis_ai: dto.catatan_analisis_ai || null,
        ringkasan_analisis_ai: dto.ringkasan_analisis_ai || null,
        saran_analisis_ai: dto.saran_analisis_ai || null,
      },
    });
  }

  // 5. Mengambil data hasil lab yang sudah disimpan untuk kunjungan tertentu (berdasarkan pasien)
  async getHasilLabByKunjungan(id_kunjungan: string) {
    const activeKunjungan = await this.prisma.kunjungan.findUnique({
      where: { id_kunjungan },
      select: { id_pasien: true },
    });

    if (!activeKunjungan) {
      return [];
    }

    return this.prisma.hasil_laboratorium.findMany({
      where: {
        kunjungan: {
          id_pasien: activeKunjungan.id_pasien,
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // 6. Menghapus satu berkas hasil laboratorium berdasarkan id
  async deleteHasilLab(id_hasil_lab: string) {
    const record = await this.prisma.hasil_laboratorium.findUnique({
      where: { id_hasil_lab },
    });

    if (!record) {
      throw new NotFoundException('Data hasil laboratorium tidak ditemukan!');
    }

    return this.prisma.hasil_laboratorium.delete({
      where: { id_hasil_lab },
    });
  }

  // 7. AI Clinical Analysis & Recommendations Generator
  async analyzeLabResults(daftarPemeriksaan: any[]) {
    const prompt = `
      Anda adalah Asisten AI Analisis Klinis Laboratorium Medis yang berwibawa, profesional, dan sangat to-the-point.
      Tugas Anda adalah membaca data pemeriksaan laboratorium medis di bawah ini dan menyusun sebuah Ringkasan Analisis Klinis serta Saran Medis yang sangat padat, tajam, dan langsung tertuju pada masalah klinis utama.

      PENTING: Dokter dan Nurse sangat sibuk dan rawan mengabaikan paragraf panjang. Oleh karena itu, Anda WAJIB membatasi output Anda agar sangat ringkas, menggunakan poin-poin tebal (bold bullet points), dan bebas dari kalimat basa-basi / penjelasan pembuka-penutup.

      Data Pemeriksaan Laboratorium:
      ${JSON.stringify(daftarPemeriksaan, null, 2)}

      Wajib merespons HANYA dalam format JSON bersih tanpa tanda kutip markdown (\`\`\`), tanpa teks penjelasan pembuka atau penutup. 
      Struktur JSON yang wajib Anda hasilkan harus persis seperti ini:
      {
        "ringkasan": "### 🔬 RINGKASAN KLINIS (AI Summary)\\n- **Temuan Utama**: Hb 9.5 (Low), Leukosit 16.500 (High)\\n- **Kecurigaan Klinis**: Suspek Infeksi Bakteri Akut, Anemia Mikrositik",
        "saran": "### 📋 REKOMENDASI TAKTIS (AI Recommendations)\\n- **Nurse**: Pantau suhu tubuh berkala, edukasi hidrasi\\n- **Dokter (DPJP)**: Pertimbangkan kultur darah, terapi antibiotik"
      }

      Gunakan Bahasa Indonesia medis yang formal, tegas, dan sangat padat.
    `;

    try {
      const response = await this.generateContentWithFallback({
        contents: prompt,
      });

      const rawText = response.text || '';
      try {
        const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonText);
        return {
          ringkasan: parsed.ringkasan || '',
          saran: parsed.saran || '',
        };
      } catch (e) {
        console.warn("Failed to parse Gemini response as JSON, using manual split:", e);
        const parts = rawText.split(/### 📋 SARAN|### 📋 REKOMENDASI/i);
        const ringkasan = parts[0] ? parts[0].trim() : rawText;
        const saran = parts[1] ? `### 📋 REKOMENDASI TAKTIS (AI Recommendations)\n` + parts[1].trim() : '';
        return { ringkasan, saran };
      }
    } catch (err: any) {
      console.error('Error generating AI clinical analysis:', err);
      throw new Error('Gagal memproses analisis klinis AI Gemini.');
    }
  }
}