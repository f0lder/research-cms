import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaService } from './schema.service';
import { SchemaController } from './schema.controller';
import { ContentType, ContentTypeSchema } from './schemas/content-type.schema';
import { ContentEntryModel, ContentEntrySchema } from '../content/schemas/content-entry.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ContentType.name, schema: ContentTypeSchema },
			{ name: ContentEntryModel.name, schema: ContentEntrySchema },
		])
	],
	controllers: [SchemaController],
	providers: [SchemaService],
	exports: [SchemaService],
})
export class SchemaModule { }