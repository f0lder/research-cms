import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockLayoutModel, BlockLayoutDocument } from './schemas/block-layout.schema';
import { Block, BlockLayout, ContentTypeDefinition, FieldBlock } from '@research-cms/shared-types';

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
   * Bootstrap a default layout from a schema definition — returns FieldBlock[] for each schema field.
   */
  bootstrapFromSchema(schema: Pick<ContentTypeDefinition, 'slug' | 'fields'>): BlockLayout {
    return {
      schemaSlug: schema.slug,
      blocks: schema.fields.map((f, i) => ({
        type: 'field' as const,
        fieldName: f.name,
        label: f.label,
        fieldType: f.type,
        value: null,
        visible: true,
        order: i,
      } as FieldBlock)),
    };
  }

  /**
   * Merge a saved block list against the current schema fields:
   * - Preserve static blocks (heading, text, archive)
   * - Drop field blocks whose fieldName no longer exists in the schema
   * - Update field block label/type from the live schema
   * - Append field blocks for new schema fields
   * Returns bootstrap layout when saved is null.
   */
  syncWithSchema(
    schema: Pick<ContentTypeDefinition, 'slug' | 'fields'>,
    saved: Block[] | null,
  ): Block[] {
    if (!saved) return this.bootstrapFromSchema(schema).blocks;

    const fieldMap = new Map(schema.fields.map(f => [f.name, f]));

    // Keep static blocks and valid field blocks
    const retained: Block[] = [];
    for (const b of saved) {
      if (b.type === 'field') {
        const f = fieldMap.get((b as FieldBlock).fieldName);
        if (f) {
          retained.push({
            ...(b as FieldBlock),
            label: f.label,
            fieldType: f.type,
          } as FieldBlock);
        }
      } else {
        // Keep static blocks as-is
        retained.push(b);
      }
    }

    // Add new field blocks for schema fields not yet in layout
    const retainedFieldNames = new Set(
      retained
        .filter((b): b is FieldBlock => b.type === 'field')
        .map(b => b.fieldName)
    );
    const appended: FieldBlock[] = schema.fields
      .filter(f => !retainedFieldNames.has(f.name))
      .map((f, i) => ({
        type: 'field' as const,
        fieldName: f.name,
        label: f.label,
        fieldType: f.type,
        value: null,
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
