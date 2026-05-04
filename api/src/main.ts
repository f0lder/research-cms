import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';
import dns from 'dns';

// Resolve DNS to prevent potential issues with MongoDB Atlas connections
dns.setServers(['1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Parse cookies
  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:19006', 'http://localhost:8081'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();