import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockLayoutModel, BlockLayoutDocument } from './schemas/block-layout.schema';
import { BlockDefinition, BlockLayout, ContentTypeDefinition } from '@research-cms/shared-types';

@Injectable()
export class LayoutsService {
  constructor(
    @InjectModel(BlockLayoutModel.name) private model: Model<BlockLayoutDocument>,
  ) {}

  /** Get layout for a schema. Returns null if none saved yet. */
  async findOne(schemaSlug: string): Promise<BlockLayoutDocument | null> {
    return this.model.findOne({ schemaSlug }).exec();
  }

  /**
   * Save (upsert) a layout for a schema.
   * If no layout exists yet, derives blocks from the schema fields.
   */
  async upsert(schemaSlug: string, blocks: BlockDefinition[]): Promise<BlockLayoutDocument> {
    return this.model.findOneAndUpdate(
      { schemaSlug },
      { $set: { blocks } },
      { upsert: true, returnDocument: 'after', new: true },
    ).exec();
  }

  /**
   * Bootstrap a default layout from a schema definition (called when first
   * opening the layout editor — all fields visible, ordered by schema order).
   */
  bootstrapFromSchema(schema: Pick<ContentTypeDefinition, 'slug' | 'fields'>): BlockLayout {
    return {
      schemaSlug: schema.slug,
      blocks: schema.fields.map((f, i) => ({
        fieldName: f.name,
        label: f.label,
        type: f.type,
        visible: true,
        order: i,
      })),
    };
  }

  /** Delete layout when a schema is deleted. */
  async deleteBySlug(schemaSlug: string): Promise<void> {
    await this.model.deleteOne({ schemaSlug }).exec();
  }
}
