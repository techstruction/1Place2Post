import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix — all routes become /api/*
  app.setGlobalPrefix('api');

  // Validate all incoming DTOs using class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Allow Next.js frontend to call the API
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://1place2post-st.techstruction.co',
      'https://1place2post.techstruction.co',
    ],
    credentials: true,
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 35763;
  await app.listen(port, '0.0.0.0');

  console.log(`API listening on ${port}`);
}
bootstrap();

