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

  /**
	 * Get formatted activity feed grouped by day with pagination
	 * Returns human-readable activity timeline
	 */
	async getActivityFeed(limit = 100, offset = 0): Promise<{ date: string; activities: Array<{ time: string; message: string }> }[]> {
		const logs = (await this.model.find({}).sort({ createdAt: -1 }).skip(offset).limit(limit).lean().exec()) as any[];
		// Group logs by date
		const grouped: Record<string, any[]> = {};
		logs.forEach(log => {
			const createdDate = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
			const date = createdDate.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
			if (!grouped[date]) grouped[date] = [];
			grouped[date].push(log);
		});

		// Convert to readable format
		return Object.entries(grouped).map(([date, activities]) => ({
			date,
			activities: activities.map(log => {
				const createdDate = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
				return {
					time: createdDate.toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit',
					}),
					message: log.message,
				};
			}),
		}));
	}
}
