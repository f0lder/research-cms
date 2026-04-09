import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { ApiKeyModel, ApiKeyDocument } from './schemas/api-key.schema';
import { Block } from '@research-cms/shared-types';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKeyModel.name) private model: Model<ApiKeyDocument>,
    private readonly logsService: LogsService,
  ) {}

  async findAll(): Promise<ApiKeyDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ApiKeyDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Client not found');
    return doc;
  }

  async create(name: string): Promise<ApiKeyDocument> {
    const key = `cms_${randomBytes(24).toString('hex')}`;
    const doc = await this.model.create({ name, key });
    void this.logsService.log(`Client created: "${name}"`, ['client', 'create'], { name, id: String(doc._id) });
    return doc;
  }

  async delete(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Client not found');
    void this.logsService.log(`Client deleted: "${result.name}"`, ['client', 'delete'], { name: result.name, id });
  }

  async updateAllowedSchemas(id: string, allowedSchemas: string[]): Promise<ApiKeyDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { allowedSchemas } },
      { returnDocument: 'after' },
    ).exec();
    if (!doc) throw new NotFoundException('Client not found');
    return doc;
  }

  async setHomePage(id: string, pageId: string | null): Promise<ApiKeyDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { homePage: pageId } },
      { returnDocument: 'after' },
    ).exec();
    if (!doc) throw new NotFoundException('Client not found');
    return doc;
  }

  /**
   * Upserts the block layout for a specific schema on this client.
   * Uses a two-step pull-then-push to simulate an atomic upsert on the subdocument array.
   */
  async upsertLayout(id: string, schemaSlug: string, blocks: Block[]): Promise<ApiKeyDocument> {
    // Try to update the existing layout entry for this schema
    let doc = await this.model.findOneAndUpdate(
      { _id: id, 'layouts.schemaSlug': schemaSlug },
      { $set: { 'layouts.$.blocks': blocks } },
      { returnDocument: 'after' },
    ).exec();

    if (!doc) {
      // No layout for this schema yet — push a new entry
      doc = await this.model.findByIdAndUpdate(
        id,
        { $push: { layouts: { schemaSlug, blocks } } },
        { returnDocument: 'after' },
      ).exec();
    }

    if (!doc) throw new NotFoundException('Client not found');
    return doc;
  }

  /** Called by ApiKeyGuard on every public request — validates key and tracks usage. */
  async validateAndTrack(key: string): Promise<ApiKeyDocument | null> {
    const doc = await this.model.findOne({ key, active: true }).exec();
    if (!doc) return null;
    await this.model.findByIdAndUpdate(doc._id, {
      $inc: { hits: 1 },
      $set: { lastUsedAt: new Date().toISOString() },
    }).exec();
    return doc;
  }
}
