import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token autentikasi tidak ditemukan.');
    }

    const token = authHeader.split(' ')[1];
    const session = await this.authService.validateSession(token);

    if (!session) {
      throw new UnauthorizedException('Sesi tidak aktif atau telah kedaluwarsa.');
    }

    // Attach user and session to request object
    request.user = {
      id_pegawai: session.user.pegawai?.id_pegawai || session.user.id_user,
      id_user: session.user.id_user,
      username: session.user.username,
      nama_lengkap: session.user.pegawai?.nama_lengkap || '',
      role: session.user.role,
      status_aktif: session.user.status_aktif,
      status_verifikasi: session.user.status_verifikasi,
      master_role: session.user.master_role,
    };
    request.session = session;

    return true;
  }
}
