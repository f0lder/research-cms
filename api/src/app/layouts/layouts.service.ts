import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockLayoutModel, BlockLayoutDocument } from './schemas/block-layout.schema';
import { BlockLayout, ContentTypeDefinition, LayoutBlock, Block } from '@research-cms/shared-types';

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
   */
  async upsert(schemaSlug: string, blocks: Block[]): Promise<BlockLayoutDocument> {
    return this.model.findOneAndUpdate(
      { schemaSlug },
      { $set: { blocks } },
      { upsert: true, returnDocument: 'after', new: true },
    ).exec();
  }

  /**
   * Bootstrap a default layout from a schema definition — returns Block[].
   */
  bootstrapFromSchema(schema: Pick<ContentTypeDefinition, 'slug' | 'fields'>): { schemaSlug: string; blocks: Block[] } {
    const { v4: uuidv4 } = require('uuid');
    return {
      schemaSlug: schema.slug,
      blocks: schema.fields.map((f, i) => ({
        id: uuidv4(),
        type: 'field' as const,
        visible: true,
        order: i,
        config: {
          fieldName: f.name,
          label: f.label,
          fieldType: f.type,
          showLabel: true,
          labelPosition: 'above' as const,
          value: null,
        },
      } as unknown)) as Block[],
    };
  }

  /**
   * Merge a saved block list against the current schema fields:
   * - Keep all non-field blocks (archive, heading, text, image, etc.)
   * - For field blocks: update label/fieldType from schema if field still exists
   * - Drop field blocks whose fieldName no longer exists
   * - If no saved layout, bootstrap with field blocks for all schema fields
   */
  syncWithSchema(
    schema: Pick<ContentTypeDefinition, 'slug' | 'fields'>,
    saved: any[] | null,
  ): Block[] {
    if (!saved) return this.bootstrapFromSchema(schema).blocks;

    const fieldMap = new Map(schema.fields.map(f => [f.name, f]));

    // Process saved blocks:
    // - Keep non-field blocks as-is
    // - Update field blocks with current schema info
    // - Drop field blocks whose fieldName no longer exists
    const retained: Block[] = [];
    for (const b of saved) {
      if (b.type === 'field') {
        // Handle both old structure (fieldName at top level) and new (in config)
        const fieldName = b.config?.fieldName || b.fieldName;
        if (!fieldName) continue;
        
        const f = fieldMap.get(fieldName);
        if (f) {
          // Keep field block but update label and fieldType from schema
          retained.push({
            ...b,
            config: {
              ...(b.config || {}),
              label: f.label,
              fieldType: f.type,
            },
          } as Block);
        }
        // Drop field blocks for fields that no longer exist
      } else {
        // Keep all non-field blocks as-is
        retained.push(b);
      }
    }

    return retained;
  }

  /** Delete layout when a schema is deleted. */
  async deleteBySlug(schemaSlug: string): Promise<void> {
    await this.model.deleteOne({ schemaSlug }).exec();
  }
}
