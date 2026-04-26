import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { ApiKeyModel, ApiKeyDocument } from './schemas/api-key.schema';
import { Block } from '@research-cms/shared-types';
import { LogsService } from '../logs/logs.service';
import { SchemaService } from '../schema/schema.service';
import { syncWithSchema } from './layout-utils';

@Injectable()
export class ApiKeysService implements OnModuleInit {
  constructor(
    @InjectModel(ApiKeyModel.name) private model: Model<ApiKeyDocument>,
    private readonly logsService: LogsService,
    private readonly schemaService: SchemaService,
  ) {}

  /**
   * One-time cleanup: any layout subdocs from before the schemaSlug→schemaId migration
   * are invalid under the new shape. Wipe layouts[] on affected docs so admins can re-save.
   * Idempotent: after the first run no docs match the filter.
   */
  async onModuleInit(): Promise<void> {
    await this.model.updateMany(
      { 'layouts.schemaSlug': { $exists: true } },
      { $set: { layouts: [] } },
    ).exec();
  }

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

  /**
   * Read a client's layout for a schema, synced against the schema's current fields.
   * Returns both the schemaId and schemaSlug for clarity.
   * Bootstraps a default field-block layout when the client has nothing saved.
   */
  async getLayout(
    clientId: string,
    schemaId: string,
  ): Promise<{ schemaId: string; schemaSlug: string; blocks: Block[] }> {
    const [client, schema] = await Promise.all([
      this.findOne(clientId),
      this.schemaService.findById(schemaId),
    ]);

    const saved = client.layouts.find(l => String(l.schemaId) === schemaId);
    const blocks = syncWithSchema(schema, (saved?.blocks ?? null) as unknown[] | null);

    return { schemaId, schemaSlug: schema.slug, blocks };
  }

  /** Upsert a client's layout for a schema. */
  async upsertLayout(clientId: string, schemaId: string, blocks: Block[]): Promise<ApiKeyDocument> {
    const objectId = new Types.ObjectId(schemaId);

    let doc = await this.model.findOneAndUpdate(
      { _id: clientId, 'layouts.schemaId': objectId },
      { $set: { 'layouts.$.blocks': blocks } },
      { returnDocument: 'after' },
    ).exec();

    if (!doc) {
      doc = await this.model.findByIdAndUpdate(
        clientId,
        { $push: { layouts: { schemaId: objectId, blocks } } },
        { returnDocument: 'after' },
      ).exec();
    }

    if (!doc) throw new NotFoundException('Client not found');
    return doc;
  }

  /** Called by ApiKeyGuard on every public request — validates key, tracks usage, and updates hitcount. */
  async validateAndTrack(key: string, ipAddress?: string): Promise<ApiKeyDocument | null> {
    const doc = await this.model.findOne({ key, active: true }).exec();
    if (!doc) return null;

    const today = new Date().toISOString().split('T')[0];
    const docToReturn = await this.model.findByIdAndUpdate(doc._id, {
      $set: {
        lastUsedAt: new Date().toISOString(),
        _lastIpDate: ipAddress ? `${ipAddress}:${today}` : `unknown:${today}`,
      },
    }).exec();

    if (doc._lastIpDate !== `${ipAddress || 'unknown'}:${today}`) {
      await this.model.findByIdAndUpdate(doc._id, {
        $inc: { hits: 1 },
      }).exec();
    }

    return docToReturn;
  }
}
