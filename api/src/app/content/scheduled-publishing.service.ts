import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentEntryModel, ContentEntryDocument } from './schemas/content-entry.schema';
import { LogsService } from '../logs/logs.service';
import { CmsEvents, ContentPublishedEvent, ContentUnpublishedEvent } from '../events';

/**
 * Scheduled Publishing Service
 * Automatically publishes and unpublishes entries based on publishAt/unpublishAt timestamps
 * Runs every minute to check for entries that should change status
 */
@Injectable()
export class ScheduledPublishingService {
	private readonly logger = new Logger(ScheduledPublishingService.name);

	constructor(
		@InjectModel(ContentEntryModel.name) private model: Model<ContentEntryDocument>,
		private readonly logsService: LogsService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	/**
	 * Process scheduled publishing — runs every minute
	 * Publishes entries with publishAt <= now
	 * Unpublishes entries with unpublishAt <= now
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async processScheduledPublishing(): Promise<void> {
		const now = new Date();
		try {
			// Auto-publish scheduled entries
			const toPublish = await this.model.find({
				status: 'scheduled',
				publishAt: { $lte: now },
				deletedAt: null,
			}).exec();

			for (const entry of toPublish) {
				await this.model.findByIdAndUpdate(entry._id, {
					$set: { status: 'published' }
				});
				this.eventEmitter.emit(
					CmsEvents.CONTENT_PUBLISHED,
					new ContentPublishedEvent(entry.schemaSlug, String(entry._id), 'scheduled')
				);
			}

			if (toPublish.length > 0) {
				this.logger.log(`Published ${toPublish.length} scheduled entries`);
				void this.logsService.log(
					`Auto-published ${toPublish.length} entries`,
					['content', 'scheduled-publishing'],
					{ count: toPublish.length }
				);
			}

			// Auto-unpublish expired entries
			const toUnpublish = await this.model.find({
				status: 'published',
				unpublishAt: { $lte: now, $ne: null },
				deletedAt: null,
			}).exec();

			for (const entry of toUnpublish) {
				await this.model.findByIdAndUpdate(entry._id, {
					$set: { status: 'archived' }
				});
				this.eventEmitter.emit(
					CmsEvents.CONTENT_UNPUBLISHED,
					new ContentUnpublishedEvent(entry.schemaSlug, String(entry._id), 'scheduled')
				);
			}

			if (toUnpublish.length > 0) {
				this.logger.log(`Unpublished ${toUnpublish.length} expired entries`);
				void this.logsService.log(
					`Auto-unpublished ${toUnpublish.length} entries`,
					['content', 'scheduled-publishing'],
					{ count: toUnpublish.length }
				);
			}
		} catch (error) {
			this.logger.error('Error processing scheduled publishing', error);
		}
	}
}
