import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');                       // todas las rutas cuelgan de /api (el frontend y el puente usan /api/...)
  app.useBodyParser('json', { limit: '5mb' });      // un paquete del puente puede traer varios cientos de muestras
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
