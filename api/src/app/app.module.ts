import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaModule } from './schema/schema.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';
import { LayoutsModule } from './layouts/layouts.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PublicModule } from './public/public.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/nestjs-api'),
    LogsModule,
    AuthModule,
    SchemaModule,
    ContentModule,
    LayoutsModule,
    ApiKeysModule,
    PublicModule,
  ],
})
export class AppModule {}
