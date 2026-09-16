import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.use(compression());

  app.use(json({
    limit: '50mb',
    // Guardamos el cuerpo original solo para el webhook de Bold (se usa para validar la firma)
    verify: (req: any, _res, buf: Buffer) => {
      if ((req.originalUrl || req.url || '').startsWith('/pagos/webhook')) {
        req.rawBody = Buffer.from(buf);
      }
    },
  }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: false,
    forbidNonWhitelisted: false,
    transform: true,
  }));

  await app.listen(3000);
}
bootstrap();