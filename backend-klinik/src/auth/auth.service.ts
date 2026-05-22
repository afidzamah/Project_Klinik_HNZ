import { Injectable, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  // Auto-seed master roles and superadmin on module initialization
  async onModuleInit() {
    await this.seedRolesAndSuperadmin();
  }

  async seedRolesAndSuperadmin() {
    const defaultRoles = [
      {
        kode_role: 'pendaftaran',
        nama_role: 'Pendaftaran & Loket A',
        menu_akses: ['/pendaftaran', '/pendaftaran/laporan', '/kiosk']
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
        menu_akses: ['/farmasi']
      },
      {
        kode_role: 'superadmin',
        nama_role: 'Superadmin Keamanan',
        menu_akses: ['/kiosk', '/pendaftaran', '/pendaftaran/laporan', '/nurse-station', '/dokter', '/farmasi', '/monitoring', '/superadmin']
      }
    ];

    for (const r of defaultRoles) {
      await this.prisma.master_role.upsert({
        where: { kode_role: r.kode_role },
        update: {},
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
      const existingSuper = await this.prisma.pegawai.findUnique({
        where: { username: 'superadmin.demo' }
      });

      if (!existingSuper) {
        const hashedPassword = this.hashPassword('demo123');
        await this.prisma.pegawai.create({
          data: {
            username: 'superadmin.demo',
            password: hashedPassword,
            nama_lengkap: 'Superadmin HNZ',
            role: 'superadmin',
            id_role: superadminRole.id_role,
            status_aktif: true,
            status_verifikasi: 'DISETUJUI'
          }
        });
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
    const existing = await this.prisma.pegawai.findUnique({
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

    const newPegawai = await this.prisma.pegawai.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        nama_lengkap: dto.nama_lengkap,
        role: dto.role, // Fallback string representation
        id_role: roleRecord.id_role,
        status_aktif: true,
        status_verifikasi: 'PENDING', // Requires superadmin approval
      },
      select: {
        id_pegawai: true,
        username: true,
        nama_lengkap: true,
        role: true,
        status_aktif: true,
        status_verifikasi: true,
        created_at: true,
      },
    });

    return {
      message: 'Pegawai berhasil terdaftar. Harap tunggu verifikasi Superadmin untuk masuk.',
      data: newPegawai,
    };
  }

  // Login employee, create session and return session token
  async login(dto: any, ipAddress?: string, userAgent?: string) {
    let user = await this.prisma.pegawai.findUnique({
      where: { username: dto.username },
      include: { master_role: true }
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
      user = await this.prisma.pegawai.create({
        data: {
          username: dto.username,
          password: hashedPassword,
          nama_lengkap,
          role,
          id_role: roleRecord?.id_role,
          status_aktif: true,
          status_verifikasi: 'DISETUJUI',
        },
        include: { master_role: true }
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
        id_pegawai: user.id_pegawai,
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
        deskripsi: `Pegawai ${user.nama_lengkap} masuk ke sistem sebagai peran ${user.role}.`,
      },
    });

    return {
      message: 'Login berhasil.',
      token: token,
      user: {
        id_pegawai: user.id_pegawai,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        menu_akses: user.master_role?.menu_akses || [],
      },
    };
  }

  // Logout employee, update waktu_logout
  async logout(token: string) {
    const session = await this.prisma.sesi_pegawai.findUnique({
      where: { token },
      include: { pegawai: true },
    });

    if (!session) {
      throw new UnauthorizedException('Sesi tidak ditemukan.');
    }

    // Add activity log before logging out
    await this.prisma.log_aktivitas.create({
      data: {
        id_sesi: session.id_sesi,
        endpoint: 'POST /auth/logout',
        deskripsi: `Pegawai ${session.pegawai.nama_lengkap} keluar dari sistem.`,
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
        pegawai: {
          select: {
            id_pegawai: true,
            username: true,
            nama_lengkap: true,
            role: true,
            status_aktif: true,
            status_verifikasi: true,
            master_role: true,
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
  async getSessionLogs(id_pegawai: string) {
    return this.prisma.sesi_pegawai.findMany({
      where: { id_pegawai },
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
    return this.prisma.sesi_pegawai.findMany({
      orderBy: { waktu_login: 'desc' },
      include: {
        pegawai: {
          select: {
            username: true,
            nama_lengkap: true,
            role: true,
            status_aktif: true,
            status_verifikasi: true,
          },
        },
        log_aktivitas: {
          orderBy: { waktu_aksi: 'desc' },
        },
      },
      take: 50, // Limit to recent 50 sessions for performance
    });
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
    return this.prisma.pegawai.findMany({
      where: { status_verifikasi: 'PENDING' },
      include: { master_role: true },
      orderBy: { created_at: 'desc' },
    });
  }

  // Retrieve active verified employees
  async getActivePegawai() {
    return this.prisma.pegawai.findMany({
      where: { 
        status_verifikasi: 'DISETUJUI',
        NOT: { username: 'superadmin.demo' } // Don't allow deactivating main superadmin
      },
      include: { master_role: true },
      orderBy: { created_at: 'desc' },
    });
  }

  // Approve or reject employee registration
  async verifyPegawai(id_pegawai: string, status: string) {
    if (status !== 'DISETUJUI' && status !== 'DITOLAK') {
      throw new ConflictException('Status verifikasi tidak valid.');
    }

    return this.prisma.pegawai.update({
      where: { id_pegawai },
      data: { status_verifikasi: status },
    });
  }

  // Suspend or activate employee account
  async togglePegawaiStatus(id_pegawai: string, status_aktif: boolean) {
    return this.prisma.pegawai.update({
      where: { id_pegawai },
      data: { status_aktif },
    });
  }
}
