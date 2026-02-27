import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ¡Agregamos esta línea mágica para darle permiso a tu HTML!
  app.enableCors(); 

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();