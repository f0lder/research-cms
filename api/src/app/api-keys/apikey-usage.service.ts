import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { CmsEvents, ApiKeyUsedEvent } from '../events';
import { ApiKeyUsageModel, ApiKeyUsageDocument } from './schemas/apikey-usage.schema';

@Injectable()
export class ApiKeyUsageService {
  constructor(
    @InjectModel(ApiKeyUsageModel.name)
    private model: Model<ApiKeyUsageDocument>,
  ) {}

  @OnEvent(CmsEvents.APIKEY_USED)
  async handleApiKeyUsed(event: ApiKeyUsedEvent): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const schemaSlug = event.schemaSlug || 'unknown';
    const ipAddress = event.ipAddress;

    // First, check if this IP is already tracked for this date
    const existing = await this.model.findOne({ keyId: event.keyId, date }).exec();
    const isNewUser = !existing || !existing.users?.includes(ipAddress);

    // Add IP only if it doesn't already exist, and increment userCount only for new IPs
    await this.model
      .findOneAndUpdate(
        { keyId: event.keyId, date },
        {
          $addToSet: { users: ipAddress },
          ...(isNewUser && { $inc: { userCount: 1 } }),
          $inc: { [`schemas.${schemaSlug}`]: 1 },
        },
        { upsert: true },
      )
      .exec();
  }

  async getUsage(
    keyId: string,
    days = 30,
  ): Promise<{ date: string; userCount: number; users: string[]; schemas: Record<string, number> }[]> {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().split('T')[0];

    return this.model
      .find({ keyId, date: { $gte: fromStr } })
      .sort({ date: 1 })
      .lean()
      .exec();
  }

  async clearUsage(keyId: string): Promise<void> {
    await this.model.deleteMany({ keyId }).exec();
  }
}
