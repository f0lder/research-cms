import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogEntryModel, LogEntryDocument } from './schemas/log-entry.schema';

export interface LogsQuery {
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(LogEntryModel.name) private model: Model<LogEntryDocument>,
  ) {}

  /** Write a log entry. Fire-and-forget — never throws. */
  log(message: string, tags: string[] = [], meta?: Record<string, unknown>): void {
    this.model.create({ message, tags, meta: meta ?? null }).catch(() => { /* silent */ });
  }

  async findAll(query: LogsQuery = {}): Promise<{ entries: LogEntryDocument[]; total: number }> {
    const { tags, search, limit = 50, offset = 0 } = query;
    const filter: Record<string, unknown> = {};

    if (tags && tags.length > 0) filter.tags = { $all: tags };
    if (search) filter.message = { $regex: search, $options: 'i' };

    const [entries, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { entries, total };
  }

  /** Returns all distinct tags used across log entries. */
  async distinctTags(): Promise<string[]> {
    return this.model.distinct('tags').exec();
  }

  async clear(): Promise<void> {
    await this.model.deleteMany({}).exec();
  }
}
