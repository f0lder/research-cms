import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SchemaModule } from './schema/schema.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';
import { LayoutsModule } from './layouts/layouts.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PublicModule } from './public/public.module';
import { LogsModule } from './logs/logs.module';
import { MediaModule } from './media/media.module';
import { PagesModule } from './pages/pages.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/nestjs-api'),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    ScheduleModule.forRoot(),
    LogsModule,
    MediaModule,
    AuthModule,
    SchemaModule,
    ContentModule,
    LayoutsModule,
    ApiKeysModule,
    PagesModule,
    WebhooksModule,
    PublicModule,
  ],
})
export class AppModule {}
