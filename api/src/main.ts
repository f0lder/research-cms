import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:19006', 'http://localhost:8081'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();