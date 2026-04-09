import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentEntryModel, ContentEntryDocument } from './schemas/content-entry.schema';
import { LogsService } from '../logs/logs.service';

/**
 * Scheduled Publishing Service
 * Automatically publishes entries based on publishAt timestamps
 * Runs every minute to check for entries that should change status
 */
@Injectable()
export class ScheduledPublishingService {
	private readonly logger = new Logger(ScheduledPublishingService.name);

	constructor(
		@InjectModel(ContentEntryModel.name) private model: Model<ContentEntryDocument>,
		private readonly logsService: LogsService,
	) {}

	/**
	 * Process scheduled publishing — runs every minute
	 * Publishes entries with publishAt <= now
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async processScheduledPublishing(): Promise<void> {
		const now = new Date();
		try {
			// Auto-publish scheduled entries
			const publishResult = await this.model.updateMany(
				{ status: 'scheduled', publishAt: { $lte: now } },
				{ $set: { status: 'published', updatedAt: now } }
			).exec();

			if (publishResult.modifiedCount > 0) {
				this.logger.log(`Published ${publishResult.modifiedCount} scheduled entries`);
				void this.logsService.log(
					`Auto-published ${publishResult.modifiedCount} entries`,
					['content', 'scheduled-publishing'],
					{ count: publishResult.modifiedCount }
				);
			}
		} catch (error) {
			this.logger.error('Error processing scheduled publishing', error);
		}
	}
}
