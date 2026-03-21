import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { ApiKeyModel, ApiKeyDocument } from './schemas/api-key.schema';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKeyModel.name) private model: Model<ApiKeyDocument>,
  ) {}

  async findAll(): Promise<ApiKeyDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async create(name: string): Promise<ApiKeyDocument> {
    const key = `cms_${randomBytes(24).toString('hex')}`;
    return this.model.create({ name, key });
  }

  async delete(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`API key not found`);
  }

  async updateAllowedSchemas(id: string, allowedSchemas: string[]): Promise<ApiKeyDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { allowedSchemas } },
      { returnDocument: 'after' },
    ).exec();
    if (!doc) throw new NotFoundException('API key not found');
    return doc;
  }

  /** Called by ApiKeyGuard on every public request — validates key and tracks usage. Returns the key doc or null. */
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
