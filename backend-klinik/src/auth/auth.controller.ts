import { Controller, Post, Get, Body, Req, UseGuards, UnauthorizedException, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any, @Req() req: any) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(body, ipAddress, userAgent);
  }

  @Post('logout')
  async logout(@Body() body: { token: string }) {
    if (!body.token) {
      throw new UnauthorizedException('Token wajib disertakan untuk keluar.');
    }
    return this.authService.logout(body.token);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    return {
      user: req.user,
      session: {
        id_sesi: req.session.id_sesi,
        waktu_login: req.session.waktu_login,
        ip_address: req.session.ip_address,
      },
    };
  }

  @Get('logs')
  @UseGuards(AuthGuard)
  async getLogs(@Req() req: any) {
    return this.authService.getSessionLogs(req.user.id_user);
  }

  @Get('all-logs')
  @UseGuards(AuthGuard)
  async getAllLogs(@Req() req: any) {
    // Restrict monitoring center to superadmin or role with monitoring permission
    if (req.user.role !== 'superadmin' && !req.user.master_role?.menu_akses?.includes('/monitoring')) {
      throw new UnauthorizedException('Akses ditolak. Anda tidak memiliki izin melihat pusat pengawasan.');
    }
    return this.authService.getAllSessionLogs();
  }

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  @Get('roles-list')
  async getRolesList() {
    // Return basic details for registration select dropdown
    const roles = await this.authService.getRoles();
    return roles.map(r => ({
      kode_role: r.kode_role,
      nama_role: r.nama_role
    }));
  }

  // ==========================================
  // SUPERADMIN CONTROL ENDPOINTS
  // ==========================================

  private checkSuperadmin(req: any) {
    if (req.user.role !== 'superadmin') {
      throw new UnauthorizedException('Akses ditolak. Fitur ini memerlukan wewenang Superadmin.');
    }
  }

  @Get('roles')
  @UseGuards(AuthGuard)
  async getRoles(@Req() req: any) {
    this.checkSuperadmin(req);
    return this.authService.getRoles();
  }

  @Put('roles/:id')
  @UseGuards(AuthGuard)
  async updateRolePermissions(@Req() req: any, @Body() body: { menu_akses: string[] }) {
    this.checkSuperadmin(req);
    const id_role = req.params.id;
    return this.authService.updateRolePermissions(id_role, body.menu_akses);
  }

  @Get('pegawai/pending')
  @UseGuards(AuthGuard)
  async getPendingPegawai(@Req() req: any) {
    this.checkSuperadmin(req);
    return this.authService.getPendingPegawai();
  }

  @Get('pegawai/active')
  @UseGuards(AuthGuard)
  async getActivePegawai(@Req() req: any) {
    this.checkSuperadmin(req);
    return this.authService.getActivePegawai();
  }

  @Post('pegawai/verify')
  @UseGuards(AuthGuard)
  async verifyPegawai(@Req() req: any, @Body() body: { id_pegawai: string, status: string }) {
    this.checkSuperadmin(req);
    return this.authService.verifyPegawai(body.id_pegawai, body.status);
  }

  @Post('pegawai/toggle-status')
  @UseGuards(AuthGuard)
  async togglePegawaiStatus(@Req() req: any, @Body() body: { id_pegawai: string, status_aktif: boolean }) {
    this.checkSuperadmin(req);
    return this.authService.togglePegawaiStatus(body.id_pegawai, body.status_aktif);
  }
}
