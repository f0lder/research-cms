import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { FieldValue } from '@research-cms/shared-types';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('content')
@UseGuards(JwtAuthGuard)
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
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.EDITOR)
	create(
		@Param('schemaSlug') schemaSlug: string,
		@Body() body: { data: Record<string, FieldValue> }
	) {
		return this.contentService.create(schemaSlug, body.data);
	}

	@Put(':schemaSlug/:id')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.EDITOR)
	update(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string,
		@Body() body: { data: Record<string, FieldValue> }
	) {
		return this.contentService.update(schemaSlug, id, body.data);
	}

	@Delete(':schemaSlug/:id')
	@HttpCode(204)
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.EDITOR)
	delete(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.delete(schemaSlug, id);
	}
}
