import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { SchemaModule } from '../schema/schema.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { SettingsModule } from '../settings/settings.module';
import { MenusModule } from '../menus/menus.module';
import { ContentEntryModel, ContentEntrySchema } from '../content/schemas/content-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ContentEntryModel.name, schema: ContentEntrySchema }]),
    SchemaModule,
    ApiKeysModule,
    SettingsModule,
    MenusModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
