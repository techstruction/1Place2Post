import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Check for local SSL certificates
  const keyPath = path.join(process.cwd(), 'certs', 'key.pem');
  const certPath = path.join(process.cwd(), 'certs', 'cert.pem');
  let httpsOptions: any = undefined;

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Global prefix — all routes become /api/*
  app.setGlobalPrefix('api');

  // Validate all incoming DTOs using class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Allow Next.js frontend to call the API
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://1place2post-st.techstruction.co',
      'https://1place2post.techstruction.co',
    ],
    credentials: true,
  });

  // ── Swagger / OpenAPI ─────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('1Place2Post API')
    .setDescription(
      'REST API for the 1Place2Post social-media management platform. ' +
      'Includes MCP endpoints that let ChatGPT Custom GPTs browse the project repository.',
    )
    .setVersion('0.8.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document); // Swagger UI at /api/docs, JSON at /api/docs-json

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 35763;
  await app.listen(port, '0.0.0.0');

  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`API listening on ${protocol}://localhost:${port}`);
  console.log(`Swagger docs at ${protocol}://localhost:${port}/api/docs`);
}
bootstrap();

