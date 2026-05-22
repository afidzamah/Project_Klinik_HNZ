import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as dotenv from 'dotenv';

// Jalankan loading .env sebelum NestJS merakit komponen
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // TAMBAHKAN BARIS INI: Mengizinkan Next.js mengirim data ke NestJS
  app.enableCors();

  // Konfigurasi Header Swagger
  const config = new DocumentBuilder()
    .setTitle('API Klinik Utama HNZ')
    .setDescription('Dokumentasi lengkap API sistem Hospital Information System (HIS) Klinik HNZ')
    .setVersion('1.0')
    .addTag('Pendaftaran') // Kamu bisa menambahkan tag untuk merapikan modul
    .build();
  
  // Mencetak layar Swagger
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();