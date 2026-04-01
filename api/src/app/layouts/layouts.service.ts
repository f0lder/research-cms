import { Injectable } from '@nestjs/common';
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

  /**
   * Merge a saved block list against the current schema fields:
   * - Drop blocks whose fieldName no longer exists in the schema
   * - Update label/type from the live schema (handles renames/type changes)
   * - Append blocks for new schema fields not yet in the saved layout
   * Falls back to bootstrapFromSchema when saved is null.
   */
  syncWithSchema(
    schema: Pick<ContentTypeDefinition, 'slug' | 'fields'>,
    saved: BlockDefinition[] | null,
  ): BlockDefinition[] {
    if (!saved) return this.bootstrapFromSchema(schema).blocks;

    const fieldMap = new Map(schema.fields.map(f => [f.name, f]));

    const retained: BlockDefinition[] = [];
    for (const b of saved) {
      const f = fieldMap.get(b.fieldName);
      if (f) retained.push({ ...b, label: f.label, type: f.type });
    }

    const retainedNames = new Set(retained.map(b => b.fieldName));
    const appended: BlockDefinition[] = schema.fields
      .filter(f => !retainedNames.has(f.name))
      .map((f, i) => ({
        fieldName: f.name,
        label: f.label,
        type: f.type,
        visible: true,
        order: retained.length + i,
      }));

    return [...retained, ...appended];
  }

  /** Delete layout when a schema is deleted. */
  async deleteBySlug(schemaSlug: string): Promise<void> {
    await this.model.deleteOne({ schemaSlug }).exec();
  }
}
