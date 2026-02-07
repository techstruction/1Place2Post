import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes become /api/*
  app.setGlobalPrefix('api');

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 35763;
  await app.listen(port, '0.0.0.0');

  console.log(`API listening on ${port}`);
}
bootstrap();
