import { Injectable, NotFoundException } from '@nestjs/common';
import { SchemaService } from '../schema/schema.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentEntryModel, ContentEntryDocument } from '../content/schemas/content-entry.schema';

const PUBLISHED_FILTER = {
  status: 'published',
  deletedAt: null,
};

export interface PublicEntry {
  _id: string;
  schemaSlug: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

@Injectable()
export class PublicService {
  constructor(
    private readonly schemaService: SchemaService,
    @InjectModel(ContentEntryModel.name) private entryModel: Model<ContentEntryDocument>,
  ) {}

  private toPublicEntry(doc: ContentEntryDocument): PublicEntry {
    return {
      _id: String(doc._id),
      schemaSlug: doc.schemaSlug,
      data: doc.data as Record<string, unknown>,
      createdAt: doc.createdAt?.toISOString?.() ?? undefined,
    };
  }

  async listSchemas(allowedSchemas: string[] = []): Promise<{ slug: string; name: string }[]> {
    const schemas = await this.schemaService.findAll();
    const all = schemas.map(s => ({ slug: s.slug, name: s.name }));
    if (allowedSchemas.length === 0) return all;
    return all.filter(s => allowedSchemas.includes(s.slug));
  }

  async findAll(
    schemaSlug: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: PublicEntry[]; total: number; page: number; limit: number }> {
    const [entries, total] = await Promise.all([
      this.entryModel
        .find({ schemaSlug, ...PUBLISHED_FILTER })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.entryModel.countDocuments({ schemaSlug, ...PUBLISHED_FILTER }),
    ]);

    return { items: entries.map(e => this.toPublicEntry(e)), total, page, limit };
  }

  async findOne(
    schemaSlug: string,
    id: string,
    allowedSchemas: string[] = [],
  ): Promise<PublicEntry> {
    if (allowedSchemas.length > 0 && !allowedSchemas.includes(schemaSlug)) {
      throw new NotFoundException('Entry not found');
    }

    const entry = await this.entryModel
      .findOne({ _id: id, schemaSlug, ...PUBLISHED_FILTER })
      .exec();

    if (!entry) throw new NotFoundException('Entry not found');

    return this.toPublicEntry(entry);
  }

  async search(
    schemaSlug: string,
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: PublicEntry[]; total: number; page: number; limit: number }> {
    if (!query || query.trim().length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const [entries, total] = await Promise.all([
      this.entryModel
        .find({ schemaSlug, ...PUBLISHED_FILTER, $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.entryModel.countDocuments({ schemaSlug, ...PUBLISHED_FILTER, $text: { $search: query } }),
    ]);

    return { items: entries.map(e => this.toPublicEntry(e)), total, page, limit };
  }
}
