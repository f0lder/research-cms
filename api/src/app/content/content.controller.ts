import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { FieldValue } from '@research-cms/shared-types';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
	constructor(private readonly contentService: ContentService) {}

	@Get(':schemaSlug')
	findAll(@Param('schemaSlug') schemaSlug: string) {
		return this.contentService.findAll(schemaSlug);
	}

	@Get(':schemaSlug/:id')
	findOne(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.findOne(schemaSlug, id);
	}

	@Post(':schemaSlug')
	create(
		@Param('schemaSlug') schemaSlug: string,
		@Body() body: { data: Record<string, FieldValue> }
	) {
		return this.contentService.create(schemaSlug, body.data);
	}

	@Put(':schemaSlug/:id')
	update(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string,
		@Body() body: { data: Record<string, FieldValue> }
	) {
		return this.contentService.update(schemaSlug, id, body.data);
	}

	@Delete(':schemaSlug/:id')
	@HttpCode(204)
	delete(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.delete(schemaSlug, id);
	}
}
