import { Injectable, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  // Auto-seed master roles and superadmin on module initialization
  async onModuleInit() {
    await this.seedRolesAndSuperadmin();
    await this.seedPoliklinikAndDokter();
    await this.seedAlamatCascading();
    await this.seedDefaultSettings();
  }

  async seedAlamatCascading() {
    // 1. Seed master_jenis_alamat
    const jenisAlamats = ['KTP', 'Domisili'];
    for (const name of jenisAlamats) {
      const existing = await this.prisma.master_jenis_alamat.findFirst({
        where: { nama_jenis: name }
      });
      if (!existing) {
        await this.prisma.master_jenis_alamat.create({
          data: { nama_jenis: name }
        });
      }
    }

    // 2. Seed Cascading Address Data
    const dataAlamat = [
      {
        nama_provinsi: 'DKI Jakarta',
        kabupaten: [
          {
            nama_kabupaten: 'Jakarta Selatan',
            kecamatan: [
              {
                nama_kecamatan: 'Kebayoran Baru',
                kelurahan: ['Selong', 'Melawai', 'Gunung', 'Kramat Pela']
              },
              {
                nama_kecamatan: 'Cilandak',
                kelurahan: ['Cilandak Barat', 'Pondok Labu', 'Lebak Bulus']
              }
            ]
          },
          {
            nama_kabupaten: 'Jakarta Pusat',
            kecamatan: [
              {
                nama_kecamatan: 'Menteng',
                kelurahan: ['Menteng', 'Cikini', 'Gondangdia']
              }
            ]
          }
        ]
      },
      {
        nama_provinsi: 'Jawa Barat',
        kabupaten: [
          {
            nama_kabupaten: 'Kota Bandung',
            kecamatan: [
              {
                nama_kecamatan: 'Coblong',
                kelurahan: ['Dago', 'Lebak Siliwangi', 'Sadang Serang']
              }
            ]
          },
          {
            nama_kabupaten: 'Kota Depok',
            kecamatan: [
              {
                nama_kecamatan: 'Beji',
                kelurahan: ['Beji', 'Kemiri Muka', 'Pondok Cina']
              }
            ]
          }
        ]
      }
    ];

    for (const provData of dataAlamat) {
      let provinsi = await this.prisma.master_provinsi.findFirst({
        where: { nama_provinsi: provData.nama_provinsi }
      });
      if (!provinsi) {
        provinsi = await this.prisma.master_provinsi.create({
          data: { nama_provinsi: provData.nama_provinsi }
        });
      }

      for (const kabData of provData.kabupaten) {
        let kabupaten = await this.prisma.master_kabupaten.findFirst({
          where: {
            nama_kabupaten: kabData.nama_kabupaten,
            id_provinsi: provinsi.id_provinsi
          }
        });
        if (!kabupaten) {
          kabupaten = await this.prisma.master_kabupaten.create({
            data: {
              nama_kabupaten: kabData.nama_kabupaten,
              id_provinsi: provinsi.id_provinsi
            }
          });
        }

        for (const kecData of kabData.kecamatan) {
          let kecamatan = await this.prisma.master_kecamatan.findFirst({
            where: {
              nama_kecamatan: kecData.nama_kecamatan,
              id_kabupaten: kabupaten.id_kabupaten
            }
          });
          if (!kecamatan) {
            kecamatan = await this.prisma.master_kecamatan.create({
              data: {
                nama_kecamatan: kecData.nama_kecamatan,
                id_kabupaten: kabupaten.id_kabupaten
              }
            });
          }

          for (const kelName of kecData.kelurahan) {
            let kelurahan = await this.prisma.master_kelurahan.findFirst({
              where: {
                nama_kelurahan: kelName,
                id_kecamatan: kecamatan.id_kecamatan
              }
            });
            if (!kelurahan) {
              await this.prisma.master_kelurahan.create({
                data: {
                  nama_kelurahan: kelName,
                  id_kecamatan: kecamatan.id_kecamatan
                }
              });
            }
          }
        }
      }
    }
  }

  async seedPoliklinikAndDokter() {
    const polikliniks = [
      { nama_poli: 'Poli Umum', lokasi_gedung: 'Gedung A Lantai 1' },
      { nama_poli: 'Poli Anak (Pediatri)', lokasi_gedung: 'Gedung B Lantai 1' },
      { nama_poli: 'Poli Gigi & Mulut', lokasi_gedung: 'Gedung A Lantai 2' },
      { nama_poli: 'Poli Penyakit Dalam', lokasi_gedung: 'Gedung B Lantai 2' },
      { nama_poli: 'Poli Kandungan (Obgyn)', lokasi_gedung: 'Gedung C Lantai 1' }
    ];

    for (const p of polikliniks) {
      let existingPoli = await this.prisma.master_poliklinik.findFirst({
        where: { nama_poli: p.nama_poli }
      });

      if (!existingPoli) {
        existingPoli = await this.prisma.master_poliklinik.create({
          data: {
            nama_poli: p.nama_poli,
            lokasi_gedung: p.lokasi_gedung
          }
        });
      }

      let doctors: { nama_dokter: string; sip_dokter: string }[] = [];
      if (p.nama_poli === 'Poli Umum') {
        doctors = [
          { nama_dokter: 'Dr. Andi Wijaya', sip_dokter: '123/SIP/UMUM/2026' },
          { nama_dokter: 'Dr. Siti Aminah', sip_dokter: '124/SIP/UMUM/2026' }
        ];
      } else if (p.nama_poli === 'Poli Anak (Pediatri)') {
        doctors = [
          { nama_dokter: 'Dr. Rian Pratama, Sp.A', sip_dokter: '125/SIP/ANAK/2026' },
          { nama_dokter: 'Dr. Lilis Lestari, Sp.A', sip_dokter: '126/SIP/ANAK/2026' }
        ];
      } else if (p.nama_poli === 'Poli Gigi & Mulut') {
        doctors = [
          { nama_dokter: 'Drg. Budi Santoso', sip_dokter: '127/SIP/GIGI/2026' }
        ];
      } else if (p.nama_poli === 'Poli Penyakit Dalam') {
        doctors = [
          { nama_dokter: 'Dr. Hendra Wijaya, Sp.PD', sip_dokter: '128/SIP/DALAM/2026' }
        ];
      } else if (p.nama_poli === 'Poli Kandungan (Obgyn)') {
        doctors = [
          { nama_dokter: 'Dr. Mega Utami, Sp.OG', sip_dokter: '129/SIP/OBGYN/2026' }
        ];
      }

      for (const d of doctors) {
        const existingDoc = await this.prisma.master_dokter.findUnique({
          where: { sip_dokter: d.sip_dokter }
        });

        if (!existingDoc) {
          await this.prisma.master_dokter.create({
            data: {
              nama_dokter: d.nama_dokter,
              sip_dokter: d.sip_dokter,
              id_poli: existingPoli.id_poli,
              status_aktif: true
            }
          });
        }
      }
    }
  }

  async seedRolesAndSuperadmin() {
    const defaultRoles = [
      {
        kode_role: 'pendaftaran',
        nama_role: 'Pendaftaran & Loket A',
        menu_akses: ['/pendaftaran', '/pendaftaran/laporan', '/kiosk', '/jadwal-dokter', '/pengaturan', '/tarif', '/kasir']
      },
      {
        kode_role: 'perawat',
        nama_role: 'Perawat (Nurse Station)',
        menu_akses: ['/nurse-station']
      },
      {
        kode_role: 'dokter',
        nama_role: 'Dokter Spesialis',
        menu_akses: ['/dokter']
      },
      {
        kode_role: 'farmasi',
        nama_role: 'Farmasi & Apotek',
        menu_akses: ['/farmasi', '/kasir']
      },
      {
        kode_role: 'superadmin',
        nama_role: 'Superadmin Keamanan',
        menu_akses: ['/kiosk', '/pendaftaran', '/pendaftaran/laporan', '/nurse-station', '/dokter', '/farmasi', '/kasir', '/monitoring', '/superadmin', '/jadwal-dokter', '/pengaturan', '/tarif']
      }
    ];

    for (const r of defaultRoles) {
      await this.prisma.master_role.upsert({
        where: { kode_role: r.kode_role },
        update: {
          menu_akses: r.menu_akses
        },
        create: {
          kode_role: r.kode_role,
          nama_role: r.nama_role,
          menu_akses: r.menu_akses
        }
      });
    }

    // Seed superadmin.demo account
    const superadminRole = await this.prisma.master_role.findUnique({
      where: { kode_role: 'superadmin' }
    });

    if (superadminRole) {
      const existingSuper = await this.prisma.user.findUnique({
        where: { username: 'superadmin.demo' }
      });

      if (!existingSuper) {
        const hashedPassword = this.hashPassword('demo123');
        await this.prisma.user.create({
          data: {
            username: 'superadmin.demo',
            password: hashedPassword,
            role: 'superadmin',
            id_role: superadminRole.id_role,
            status_aktif: true,
            status_verifikasi: 'DISETUJUI',
            pegawai: {
              create: {
                nama_lengkap: 'Superadmin HNZ',
              }
            }
          }
        });
      }
    }
  }

  // Auto-seed default settings such as default_cara_bayar and queue prefixes
  async seedDefaultSettings() {
    console.log('Seeding default application settings...');
    
    // Find the ID of 'Umum Pribadi' Cara Bayar
    const umumPribadi = await this.prisma.master_cara_bayar.findFirst({
      where: { nama_cara_bayar: 'Umum Pribadi' }
    });

    if (umumPribadi) {
      const existing = await this.prisma.pengaturan_aplikasi.findUnique({
        where: { kunci: 'default_cara_bayar' }
      });

      if (!existing) {
        await this.prisma.pengaturan_aplikasi.create({
          data: {
            kunci: 'default_cara_bayar',
            nilai: umumPribadi.id_cara_bayar,
            keterangan: 'Default Cara Bayar untuk Pendaftaran Pasien (e.g. Umum Pribadi)'
          }
        });
        console.log('✅ Auto-seeded default_cara_bayar to "Umum Pribadi" UUID successfully!');
      }
    }

    // Seed prefix antrean pendaftaran
    const existingPendaftaran = await this.prisma.pengaturan_aplikasi.findUnique({
      where: { kunci: 'prefix_antrean_pendaftaran' }
    });
    if (!existingPendaftaran) {
      await this.prisma.pengaturan_aplikasi.create({
        data: {
          kunci: 'prefix_antrean_pendaftaran',
          nilai: 'L',
          keterangan: 'Prefix Huruf Antrean Pendaftaran (Loket)'
        }
      });
      console.log('✅ Auto-seeded prefix_antrean_pendaftaran to "L" successfully!');
    }

    // Seed prefix antrean nurse station
    const existingNurse = await this.prisma.pengaturan_aplikasi.findUnique({
      where: { kunci: 'prefix_antrean_nurse' }
    });
    if (!existingNurse) {
      await this.prisma.pengaturan_aplikasi.create({
        data: {
          kunci: 'prefix_antrean_nurse',
          nilai: 'N',
          keterangan: 'Prefix Huruf Antrean Nurse Station (Perawat)'
        }
      });
      console.log('✅ Auto-seeded prefix_antrean_nurse to "N" successfully!');
    }

    // Seed prefix antrean dokter
    const existingDokter = await this.prisma.pengaturan_aplikasi.findUnique({
      where: { kunci: 'prefix_antrean_dokter' }
    });
    if (!existingDokter) {
      await this.prisma.pengaturan_aplikasi.create({
        data: {
          kunci: 'prefix_antrean_dokter',
          nilai: 'P',
          keterangan: 'Prefix Huruf Antrean Pemeriksaan Dokter'
        }
      });
      console.log('✅ Auto-seeded prefix_antrean_dokter to "P" successfully!');
    }

    // Seeding Master Kelas (VIP, Kelas 1, Kelas 2, Kelas 3, Rawat Jalan)
    const defaultKelas = ['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Rawat Jalan'];
    for (const name of defaultKelas) {
      const existingK = await this.prisma.master_kelas.findFirst({
        where: { nama_kelas: name }
      });
      if (!existingK) {
        await this.prisma.master_kelas.create({
          data: { nama_kelas: name, status_aktif: true }
        });
        console.log(`✅ Auto-seeded Master Kelas "${name}" successfully!`);
      }
    }

    // Seeding Master Komponen Tarif
    const defaultKomponen = [
      { nama: 'Jasa Sarana', ket: 'Tarif untuk sarana prasarana klinik' },
      { nama: 'Jasa Medis (Dokter)', ket: 'Tarif jasa medis/dokter spesialis' },
      { nama: 'Jasa Perawat', ket: 'Tarif jasa tindakan keperawatan' },
      { nama: 'Bahan Medis Habis Pakai (BHP)', ket: 'Biaya penggunaan alat kesehatan dan obat BHP' }
    ];
    for (const comp of defaultKomponen) {
      const existingComp = await this.prisma.master_komponen_tarif.findFirst({
        where: { nama_komponen: comp.nama }
      });
      if (!existingComp) {
        await this.prisma.master_komponen_tarif.create({
          data: {
            nama_komponen: comp.nama,
            keterangan: comp.ket,
            status_aktif: true
          }
        });
        console.log(`✅ Auto-seeded Master Komponen Tarif "${comp.nama}" successfully!`);
      }
    }

    // Seeding 11 Master Tindakan
    const defaultTindakan = [
      { nama: 'Administrasi Pendaftaran', kat: 'Lainnya' },
      { nama: 'Konsultasi Dokter Umum', kat: 'Medis' },
      { nama: 'Konsultasi Dokter Spesialis', kat: 'Medis' },
      { nama: 'Pasang Infus', kat: 'Keperawatan' },
      { nama: 'Suntik Intravena', kat: 'Keperawatan' },
      { nama: 'Nebulizer', kat: 'Medis' },
      { nama: 'Rawat Luka Ringan', kat: 'Keperawatan' },
      { nama: 'Pemeriksaan Darah Lengkap', kat: 'Laboratorium' },
      { nama: 'Pemeriksaan Gula Darah', kat: 'Laboratorium' },
      { nama: 'EKG (Elektrokardiogram)', kat: 'Penunjang' },
      { nama: 'Suntik Intramuskular', kat: 'Keperawatan' }
    ];
    for (const tind of defaultTindakan) {
      const existingTind = await this.prisma.master_tindakan.findFirst({
        where: { nama_tindakan: tind.nama }
      });
      if (!existingTind) {
        await this.prisma.master_tindakan.create({
          data: {
            nama_tindakan: tind.nama,
            kategori_tindakan: tind.kat,
            status_aktif: true
          }
        });
        console.log(`✅ Auto-seeded Master Tindakan "${tind.nama}" successfully!`);
      }
    }

    // Seeding 11 Sample Tariffs for "Rawat Jalan" and "Umum Pribadi"
    const rawatJalan = await this.prisma.master_kelas.findFirst({
      where: { nama_kelas: 'Rawat Jalan' }
    });

    const umumPribadiCaraBayar = await this.prisma.master_cara_bayar.findFirst({
      where: { nama_cara_bayar: 'Umum Pribadi' }
    });

    if (rawatJalan && umumPribadiCaraBayar) {
      const tariffBreakdowns = [
        {
          tindakanNama: 'Administrasi Pendaftaran',
          components: [
            { nama: 'Jasa Sarana', nilai: 10000 },
            { nama: 'Jasa Perawat', nilai: 5000 }
          ]
        },
        {
          tindakanNama: 'Konsultasi Dokter Umum',
          components: [
            { nama: 'Jasa Sarana', nilai: 15000 },
            { nama: 'Jasa Medis (Dokter)', nilai: 35000 }
          ]
        },
        {
          tindakanNama: 'Konsultasi Dokter Spesialis',
          components: [
            { nama: 'Jasa Sarana', nilai: 30000 },
            { nama: 'Jasa Medis (Dokter)', nilai: 120000 }
          ]
        },
        {
          tindakanNama: 'Pasang Infus',
          components: [
            { nama: 'Jasa Sarana', nilai: 20000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 35000 },
            { nama: 'Jasa Perawat', nilai: 20000 }
          ]
        },
        {
          tindakanNama: 'Suntik Intravena',
          components: [
            { nama: 'Jasa Sarana', nilai: 10000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 15000 },
            { nama: 'Jasa Perawat', nilai: 15000 }
          ]
        },
        {
          tindakanNama: 'Nebulizer',
          components: [
            { nama: 'Jasa Sarana', nilai: 25000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 30000 },
            { nama: 'Jasa Medis (Dokter)', nilai: 15000 },
            { nama: 'Jasa Perawat', nilai: 15000 }
          ]
        },
        {
          tindakanNama: 'Rawat Luka Ringan',
          components: [
            { nama: 'Jasa Sarana', nilai: 15000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 25000 },
            { nama: 'Jasa Perawat', nilai: 20000 }
          ]
        },
        {
          tindakanNama: 'Pemeriksaan Darah Lengkap',
          components: [
            { nama: 'Jasa Sarana', nilai: 40000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 50000 },
            { nama: 'Jasa Perawat', nilai: 30000 }
          ]
        },
        {
          tindakanNama: 'Pemeriksaan Gula Darah',
          components: [
            { nama: 'Jasa Sarana', nilai: 10000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 15000 },
            { nama: 'Jasa Perawat', nilai: 10000 }
          ]
        },
        {
          tindakanNama: 'EKG (Elektrokardiogram)',
          components: [
            { nama: 'Jasa Sarana', nilai: 30000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 20000 },
            { nama: 'Jasa Medis (Dokter)', nilai: 40000 },
            { nama: 'Jasa Perawat', nilai: 10000 }
          ]
        },
        {
          tindakanNama: 'Suntik Intramuskular',
          components: [
            { nama: 'Jasa Sarana', nilai: 10000 },
            { nama: 'Bahan Medis Habis Pakai (BHP)', nilai: 10000 },
            { nama: 'Jasa Perawat', nilai: 10000 }
          ]
        }
      ];

      for (const tBreak of tariffBreakdowns) {
        const tindakanObj = await this.prisma.master_tindakan.findFirst({
          where: { nama_tindakan: tBreak.tindakanNama }
        });

        if (tindakanObj) {
          const existingRate = await this.prisma.master_harga_tindakan.findFirst({
            where: {
              id_tindakan: tindakanObj.id_tindakan,
              id_kelas: rawatJalan.id_kelas,
              id_cara_bayar: umumPribadiCaraBayar.id_cara_bayar
            }
          });

          if (!existingRate) {
            const totalTarif = tBreak.components.reduce((sum, item) => sum + item.nilai, 0);

            const newRateHeader = await this.prisma.master_harga_tindakan.create({
              data: {
                id_tindakan: tindakanObj.id_tindakan,
                id_kelas: rawatJalan.id_kelas,
                id_cara_bayar: umumPribadiCaraBayar.id_cara_bayar,
                total_tarif: totalTarif,
                status_aktif: true
              }
            });

            for (const cComp of tBreak.components) {
              const compObj = await this.prisma.master_komponen_tarif.findFirst({
                where: { nama_komponen: cComp.nama }
              });

              if (compObj) {
                await this.prisma.master_harga_tindakan_komponen.create({
                  data: {
                    id_harga: newRateHeader.id_harga,
                    id_komponen: compObj.id_komponen,
                    nilai_tarif: cComp.nilai
                  }
                });
              }
            }
            console.log(`✅ Auto-seeded tariff for "${tBreak.tindakanNama}" under Rawat Jalan - Umum successfully!`);
          }
        }
      }
    }
  }

  // Hash password using secure Node.js pbkdf2 algorithm (Windows compatible out-of-the-box)
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  // Verify password against stored hash
  private verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    } catch {
      return false;
    }
  }

  // Register a new employee (pegawai) with default PENDING verification
  async register(dto: any) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('Username sudah digunakan.');
    }

    const roleRecord = await this.prisma.master_role.findUnique({
      where: { kode_role: dto.role }
    });

    if (!roleRecord) {
      throw new ConflictException(`Role '${dto.role}' tidak ditemukan di sistem.`);
    }

    const hashedPassword = this.hashPassword(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        role: dto.role, // Fallback string representation
        id_role: roleRecord.id_role,
        status_aktif: true,
        status_verifikasi: 'PENDING', // Requires superadmin approval
        pegawai: {
          create: {
            nama_lengkap: dto.nama_lengkap,
          }
        }
      },
      include: {
        pegawai: true
      }
    });

    const newPegawai = {
      id_pegawai: newUser.pegawai?.id_pegawai || newUser.id_user,
      username: newUser.username,
      nama_lengkap: newUser.pegawai?.nama_lengkap || '',
      role: newUser.role,
      status_aktif: newUser.status_aktif,
      status_verifikasi: newUser.status_verifikasi,
      created_at: newUser.created_at,
    };

    return {
      message: 'Pegawai berhasil terdaftar. Harap tunggu verifikasi Superadmin untuk masuk.',
      data: newPegawai,
    };
  }

  // Login employee, create session and return session token
  async login(dto: any, ipAddress?: string, userAgent?: string) {
    let user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { master_role: true, pegawai: true }
    });

    // Auto-seed demo accounts for seamless developer testing with real audit logs
    const demoUsernames = ['pendaftaran.demo', 'nurse.demo', 'dokter.demo', 'farmasi.demo', 'superadmin.demo'];
    if (!user && demoUsernames.includes(dto.username)) {
      let role = 'pendaftaran';
      let nama_lengkap = 'Demo Pendaftaran';
      if (dto.username === 'nurse.demo') {
        role = 'perawat';
        nama_lengkap = 'Demo Perawat';
      } else if (dto.username === 'dokter.demo') {
        role = 'dokter';
        nama_lengkap = 'Demo Dokter';
      } else if (dto.username === 'farmasi.demo') {
        role = 'farmasi';
        nama_lengkap = 'Demo Apoteker';
      } else if (dto.username === 'superadmin.demo') {
        role = 'superadmin';
        nama_lengkap = 'Superadmin HNZ';
      }

      const roleRecord = await this.prisma.master_role.findUnique({
        where: { kode_role: role }
      });

      const hashedPassword = this.hashPassword('demo123');
      user = await this.prisma.user.create({
        data: {
          username: dto.username,
          password: hashedPassword,
          role,
          id_role: roleRecord?.id_role,
          status_aktif: true,
          status_verifikasi: 'DISETUJUI',
          pegawai: {
            create: {
              nama_lengkap,
            }
          }
        },
        include: { master_role: true, pegawai: true }
      });
    }

    if (!user) {
      throw new UnauthorizedException('Kredensial tidak valid.');
    }

    if (!user.status_aktif) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan oleh administrator.');
    }

    if (user.status_verifikasi === 'PENDING') {
      throw new UnauthorizedException('Akun Anda sedang menunggu verifikasi dari Superadmin.');
    }

    if (user.status_verifikasi === 'DITOLAK') {
      throw new UnauthorizedException('Pendaftaran akun Anda ditolak oleh Superadmin.');
    }

    const isPasswordValid = this.verifyPassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Kredensial tidak valid.');
    }

    // Role check helper to ensure user is logging into the matching role
    if (dto.role && user.role !== dto.role) {
      throw new UnauthorizedException(`Akun Anda tidak terdaftar sebagai peran "${dto.role}".`);
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');

    const session = await this.prisma.sesi_pegawai.create({
      data: {
        id_user: user.id_user,
        token: token,
        ip_address: ipAddress || '127.0.0.1',
        user_agent: userAgent || 'Unknown Browser',
      },
    });

    // Create initial log activity
    await this.prisma.log_aktivitas.create({
      data: {
        id_sesi: session.id_sesi,
        endpoint: 'POST /auth/login',
        deskripsi: `Pegawai ${user.pegawai?.nama_lengkap || 'Pegawai'} masuk ke sistem sebagai peran ${user.role}.`,
      },
    });

    return {
      message: 'Login berhasil.',
      token: token,
      user: {
        id_pegawai: user.pegawai?.id_pegawai || user.id_user,
        username: user.username,
        nama_lengkap: user.pegawai?.nama_lengkap || '',
        role: user.role,
        menu_akses: user.master_role?.menu_akses || [],
      },
    };
  }

  // Logout employee, update waktu_logout
  async logout(token: string) {
    const session = await this.prisma.sesi_pegawai.findUnique({
      where: { token },
      include: {
        user: {
          include: { pegawai: true }
        }
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sesi tidak ditemukan.');
    }

    // Add activity log before logging out
    await this.prisma.log_aktivitas.create({
      data: {
        id_sesi: session.id_sesi,
        endpoint: 'POST /auth/logout',
        deskripsi: `Pegawai ${session.user.pegawai?.nama_lengkap || 'Pegawai'} keluar dari sistem.`,
      },
    });

    // Update session logout time
    await this.prisma.sesi_pegawai.update({
      where: { id_sesi: session.id_sesi },
      data: { waktu_logout: new Date() },
    });

    return {
      message: 'Logout berhasil.',
    };
  }

  // Get current user profile by session token
  async validateSession(token: string) {
    const session = await this.prisma.sesi_pegawai.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id_user: true,
            username: true,
            role: true,
            status_aktif: true,
            status_verifikasi: true,
            master_role: true,
            pegawai: {
              select: {
                id_pegawai: true,
                nama_lengkap: true,
              }
            }
          },
        },
      },
    });

    if (!session || session.waktu_logout) {
      return null;
    }

    return session;
  }

  // Get session logs and activity logs for a user session
  async getSessionLogs(id_user: string) {
    return this.prisma.sesi_pegawai.findMany({
      where: { id_user },
      orderBy: { waktu_login: 'desc' },
      include: {
        log_aktivitas: {
          orderBy: { waktu_aksi: 'desc' },
        },
      },
      take: 10, // Limit to recent 10 sessions for performance
    });
  }

  // Get ALL session logs and activities for clinic monitoring
  async getAllSessionLogs() {
    const sessions = await this.prisma.sesi_pegawai.findMany({
      orderBy: { waktu_login: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            role: true,
            status_aktif: true,
            status_verifikasi: true,
            pegawai: {
              select: {
                nama_lengkap: true,
              }
            }
          },
        },
        log_aktivitas: {
          orderBy: { waktu_aksi: 'desc' },
        },
      },
      take: 50, // Limit to recent 50 sessions for performance
    });

    return sessions.map(sess => ({
      id_sesi: sess.id_sesi,
      id_user: sess.id_user,
      token: sess.token,
      waktu_login: sess.waktu_login,
      waktu_logout: sess.waktu_logout,
      ip_address: sess.ip_address,
      user_agent: sess.user_agent,
      pegawai: {
        username: sess.user.username,
        nama_lengkap: sess.user.pegawai?.nama_lengkap || '',
        role: sess.user.role,
        status_aktif: sess.user.status_aktif,
        status_verifikasi: sess.user.status_verifikasi,
      },
      log_aktivitas: sess.log_aktivitas,
    }));
  }

  // Create an explicit log entry inside an active session
  async logActivity(id_sesi: string, endpoint: string, deskripsi: string) {
    return this.prisma.log_aktivitas.create({
      data: {
        id_sesi,
        endpoint,
        deskripsi,
      },
    });
  }

  // ==========================================
  // SUPERADMIN METHODS
  // ==========================================

  // Get all master roles
  async getRoles() {
    return this.prisma.master_role.findMany({
      orderBy: { kode_role: 'asc' },
    });
  }

  // Update allowed pages for a role
  async updateRolePermissions(id_role: string, menuAkses: string[]) {
    return this.prisma.master_role.update({
      where: { id_role },
      data: { menu_akses: menuAkses },
    });
  }

  // Retrieve pending registration list
  async getPendingPegawai() {
    const users = await this.prisma.user.findMany({
      where: { status_verifikasi: 'PENDING' },
      include: { master_role: true, pegawai: true },
      orderBy: { created_at: 'desc' },
    });

    return users.map(u => ({
      id_pegawai: u.pegawai?.id_pegawai || u.id_user,
      id_user: u.id_user,
      username: u.username,
      nama_lengkap: u.pegawai?.nama_lengkap || '',
      role: u.role,
      status_aktif: u.status_aktif,
      status_verifikasi: u.status_verifikasi,
      created_at: u.created_at,
      master_role: u.master_role
    }));
  }

  // Retrieve active verified employees
  async getActivePegawai() {
    const users = await this.prisma.user.findMany({
      where: { 
        status_verifikasi: 'DISETUJUI',
        NOT: { username: 'superadmin.demo' } // Don't allow deactivating main superadmin
      },
      include: { master_role: true, pegawai: true },
      orderBy: { created_at: 'desc' },
    });

    return users.map(u => ({
      id_pegawai: u.pegawai?.id_pegawai || u.id_user,
      id_user: u.id_user,
      username: u.username,
      nama_lengkap: u.pegawai?.nama_lengkap || '',
      role: u.role,
      status_aktif: u.status_aktif,
      status_verifikasi: u.status_verifikasi,
      created_at: u.created_at,
      master_role: u.master_role
    }));
  }

  // Approve or reject employee registration
  async verifyPegawai(id_pegawai: string, status: string) {
    if (status !== 'DISETUJUI' && status !== 'DITOLAK') {
      throw new ConflictException('Status verifikasi tidak valid.');
    }

    const profile = await this.prisma.pegawai.findUnique({
      where: { id_pegawai },
    });

    if (!profile || !profile.id_user) {
      throw new ConflictException('Profil pegawai tidak ditemukan atau tidak terhubung ke akun.');
    }

    return this.prisma.user.update({
      where: { id_user: profile.id_user },
      data: { status_verifikasi: status },
    });
  }

  // Suspend or activate employee account
  async togglePegawaiStatus(id_pegawai: string, status_aktif: boolean) {
    const profile = await this.prisma.pegawai.findUnique({
      where: { id_pegawai },
    });

    if (!profile || !profile.id_user) {
      throw new ConflictException('Profil pegawai tidak ditemukan atau tidak terhubung ke akun.');
    }

    return this.prisma.user.update({
      where: { id_user: profile.id_user },
      data: { status_aktif },
    });
  }
}
