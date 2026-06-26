import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SchemaModule } from './schema/schema.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PublicModule } from './public/public.module';
import { LogsModule } from './logs/logs.module';
import { MediaModule } from './media/media.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SettingsModule } from './settings/settings.module';
import { MenusModule } from './menus/menus.module';
import { SystemInitService } from './system-init.service';
import { ContentType, ContentTypeSchema } from './schema/schemas/content-type.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/nestjs-api'),
    MongooseModule.forFeature([{ name: ContentType.name, schema: ContentTypeSchema }]),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    LogsModule,
    MediaModule,
    AuthModule,
    SchemaModule,
    ContentModule,
    ApiKeysModule,
    WebhooksModule,
    PublicModule,
    SettingsModule,
    MenusModule,
  ],
  providers: [
    SystemInitService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
