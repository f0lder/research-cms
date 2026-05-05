import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ContentEntryModel, ContentEntrySchema } from './schemas/content-entry.schema';
import { ContentVersionModel, ContentVersionSchema } from './schemas/content-version.schema';
import { SchemaModule } from '../schema/schema.module';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ContentEntryModel.name, schema: ContentEntrySchema },
			{ name: ContentVersionModel.name, schema: ContentVersionSchema },
		]),
		SchemaModule,
		AuthModule,
	],
	controllers: [ContentController],
	providers: [ContentService],
	exports: [ContentService],
})
export class ContentModule {}
