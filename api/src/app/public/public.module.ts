import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PublicAuthController } from './public-auth.controller';
import { SchemaModule } from '../schema/schema.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { SettingsModule } from '../settings/settings.module';
import { MenusModule } from '../menus/menus.module';
import { AuthModule } from '../auth/auth.module';
import { ContentEntryModel, ContentEntrySchema } from '../content/schemas/content-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ContentEntryModel.name, schema: ContentEntrySchema }]),
    SchemaModule,
    ApiKeysModule,
    SettingsModule,
    MenusModule,
    AuthModule,
  ],
  // PublicAuthController must be registered before PublicController — its
  // exact `/public/auth/*` routes would otherwise be shadowed by
  // PublicController's `:schemaSlug/:id` wildcard route.
  controllers: [PublicAuthController, PublicController],
  providers: [PublicService],
})
export class PublicModule {}
