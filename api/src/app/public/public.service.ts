import { Injectable, NotFoundException } from '@nestjs/common';
import { SchemaService } from '../schema/schema.service';
import { LayoutsService } from '../layouts/layouts.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentEntryModel, ContentEntryDocument } from '../content/schemas/content-entry.schema';
import { FieldValue, PublicBlock, PublicEntryResponse } from '@research-cms/shared-types';

@Injectable()
export class PublicService {
  constructor(
    private readonly schemaService: SchemaService,
    private readonly layoutsService: LayoutsService,
    @InjectModel(ContentEntryModel.name) private entryModel: Model<ContentEntryDocument>,
  ) {}

  private async resolveBlocks(schemaSlug: string, data: Record<string, unknown>): Promise<PublicBlock[]> {
    const schema = await this.schemaService.findOne(schemaSlug);
    const savedLayout = await this.layoutsService.findOne(schemaSlug);
    const layout = savedLayout ?? this.layoutsService.bootstrapFromSchema(schema);

    return layout.blocks
      .filter(b => b.visible)
      .sort((a, b) => a.order - b.order)
      .map(b => ({ ...b, value: (data[b.fieldName] ?? null) as FieldValue | null }));
  }

  async listSchemas(allowedSchemas: string[] = []): Promise<{ slug: string; name: string }[]> {
    const schemas = await this.schemaService.findAll();
    const all = schemas.map(s => ({ slug: s.slug, name: s.name }));
    if (allowedSchemas.length === 0) return all;
    return all.filter(s => allowedSchemas.includes(s.slug));
  }

  async findAll(schemaSlug: string): Promise<PublicEntryResponse[]> {
    await this.schemaService.findOne(schemaSlug); // throws 400 if not found
    const entries = await this.entryModel
      .find({ schemaSlug, $or: [{ 'data.status': 'published' }, { 'data.status': { $exists: false } }] })
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(
      entries.map(async e => ({
        _id: String(e._id),
        schemaSlug: e.schemaSlug,
        blocks: await this.resolveBlocks(schemaSlug, e.data as Record<string, unknown>),
        createdAt: e.createdAt?.toISOString?.() ?? undefined,
      }))
    );
  }

  async findOne(schemaSlug: string, id: string): Promise<PublicEntryResponse> {
    const entry = await this.entryModel.findOne({ _id: id, schemaSlug }).exec();
    if (!entry) throw new NotFoundException(`Entry not found`);

    return {
      _id: String(entry._id),
      schemaSlug: entry.schemaSlug,
      blocks: await this.resolveBlocks(schemaSlug, entry.data as Record<string, unknown>),
      createdAt: entry.createdAt?.toISOString?.() ?? undefined,
    };
  }
}
