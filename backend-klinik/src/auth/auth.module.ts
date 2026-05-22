import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ActivityLogInterceptor } from './activity-log.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, ActivityLogInterceptor],
  exports: [AuthService, AuthGuard, ActivityLogInterceptor],
})
export class AuthModule {}
