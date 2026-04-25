// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM INITIALIZATION (API)
// Single entry point for all API-side init:
//   - Populates the shared block registry (used for server-side block rendering)
//   - Upserts every system schema declared in shared-types/SYSTEM_SCHEMAS
// Add new system schemas in shared-types/src/lib/init.ts — no API changes needed.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SYSTEM_SCHEMAS, registerBuiltInBlocks } from '@research-cms/shared-types';
import { ContentType, ContentTypeDocument } from './schema/schemas/content-type.schema';

@Injectable()
export class SystemInitService implements OnModuleInit {
  constructor(
    @InjectModel(ContentType.name) private schemaModel: Model<ContentTypeDocument>,
  ) {}

  async onModuleInit() {
    registerBuiltInBlocks();

    for (const schema of SYSTEM_SCHEMAS) {
      await this.schemaModel.findOneAndUpdate(
        { slug: schema.slug },
        { $set: schema },
        { upsert: true },
      ).exec();
    }
  }
}
