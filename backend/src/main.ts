// eslint-disable-next-line @typescript-eslint/no-var-requires
const dns = require('node:dns');
dns.setDefaultResultOrder('verbatim');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  );
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`CineExpense Pro API running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
