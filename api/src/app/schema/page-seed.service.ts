import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentType, ContentTypeDocument } from './schemas/content-type.schema';
import { PAGE_SCHEMA_DEFINITION, PAGE_SCHEMA_SLUG } from '@research-cms/shared-types';

/**
 * Initializes the built-in page schema on startup.
 * Pages are entries in this schema, allowing Field blocks to access page-specific fields.
 * This schema cannot be deleted or renamed (system: true).
 */
@Injectable()
export class PageSeedService implements OnModuleInit {
  constructor(
    @InjectModel(ContentType.name) private schemaModel: Model<ContentTypeDocument>,
  ) {}

  async onModuleInit() {
    await this.schemaModel.findOneAndUpdate(
      { slug: PAGE_SCHEMA_SLUG },
      { $set: PAGE_SCHEMA_DEFINITION },
      { upsert: true },
    ).exec();
  }
}
