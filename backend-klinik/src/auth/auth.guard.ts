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
    request.user = session.pegawai;
    request.session = session;

    return true;
  }
}
