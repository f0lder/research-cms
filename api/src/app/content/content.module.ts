import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ContentEntryModel, ContentEntrySchema } from './schemas/content-entry.schema';
import { SchemaModule } from '../schema/schema.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ContentEntryModel.name, schema: ContentEntrySchema }
		]),
		SchemaModule,
	],
	controllers: [ContentController],
	providers: [ContentService],
	exports: [ContentService],
})
export class ContentModule {}
