import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentType, ContentTypeDocument } from '../schema/schemas/content-type.schema';
import { FieldType, MEDIA_SCHEMA_SLUG } from '@research-cms/shared-types';

/** The built-in media schema — created once on startup, never deleted via API. */
const MEDIA_SCHEMA = {
  name: 'Media',
  slug: MEDIA_SCHEMA_SLUG,
  system: true,
  fields: [
    { name: 'title',    label: 'Title',    type: FieldType.TEXT,     required: true },
    { name: 'url',      label: 'File URL', type: FieldType.TEXT,     required: true },
    { name: 'caption',  label: 'Caption',  type: FieldType.TEXTAREA, required: false },
    { name: 'altText',  label: 'Alt Text', type: FieldType.TEXT,     required: false },
    { name: 'mimeType', label: 'MIME Type',type: FieldType.TEXT,     required: false },
    { name: 'fileSize', label: 'File Size',type: FieldType.NUMBER,   required: false },
  ],
};

@Injectable()
export class MediaSeedService implements OnModuleInit {
  constructor(
    @InjectModel(ContentType.name) private schemaModel: Model<ContentTypeDocument>,
  ) {}

  async onModuleInit() {
    await this.schemaModel.findOneAndUpdate(
      { slug: MEDIA_SCHEMA_SLUG },
      { $set: MEDIA_SCHEMA },
      { upsert: true },
    ).exec();
  }
}
