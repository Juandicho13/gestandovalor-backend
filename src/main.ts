import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sin JWT_SECRET los tokens no valen nada: mejor no arrancar que arrancar inseguro
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'Falta JWT_SECRET (o es muy corto). Ponlo en las variables de entorno de Render.',
    );
  }

  // Solo estos sitios pueden llamar a la API desde un navegador
  const permitidos = [
    'https://gestandovalor.com',
    'https://www.gestandovalor.com',
    ...(process.env.ORIGENES_EXTRA || '').split(',').map((o) => o.trim()).filter(Boolean),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Sin origin = Postman, apps móviles o el propio servidor: se dejan pasar
      if (!origin) return callback(null, true);
      // Las previsualizaciones de Vercel cambian de URL en cada despliegue
      const esVercel = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
      if (permitidos.includes(origin) || esVercel) return callback(null, true);
      return callback(new Error('Origen no permitido por CORS'), false);
    },
    // Safari es estricto: si Authorization no está listado aquí, el preflight falla
    // y la petición nunca sale. Chrome a veces perdona, Safari no.
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bold-signature'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false, // usamos cabecera Bearer, no cookies
    maxAge: 86400,
  });

  // Cabeceras de seguridad. Desactivamos CSP porque esto sirve JSON, no HTML,
  // y crossOriginResourcePolicy para no romper las fotos servidas desde la API.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

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

  await app.listen(process.env.PORT || 3000);
}
bootstrap();