import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { registerBuiltInBlocks } from '@research-cms/shared-types';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Register all built-in block types
  registerBuiltInBlocks();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:19006', 'http://localhost:8081'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();