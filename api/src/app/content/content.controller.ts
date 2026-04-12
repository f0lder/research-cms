import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, HttpCode, UseGuards } from '@nestjs/common';
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
	findAll(
		@Param('schemaSlug') schemaSlug: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
	) {
		return this.contentService.findAll(schemaSlug, Number(page) || 1, Number(limit) || 50);
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

	// ─── Special Routes (must be before generic :id routes) ─────────────────

	@Get(':schemaSlug/search')
	search(
		@Param('schemaSlug') schemaSlug: string,
		@Query('q') query: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		return this.contentService.search(schemaSlug, query, Number(page) || 1, Number(limit) || 20);
	}

	@Get(':schemaSlug/trash')
	trash(
		@Param('schemaSlug') schemaSlug: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		return this.contentService.findTrash(schemaSlug, Number(page) || 1, Number(limit) || 50);
	}

	@Put(':schemaSlug/bulk-status')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.EDITOR)
	bulkUpdateStatus(
		@Param('schemaSlug') schemaSlug: string,
		@Body() body: { ids: string[]; status: string }
	) {
		return this.contentService.bulkUpdateStatus(schemaSlug, body.ids, body.status);
	}

	// ─── Generic ID Routes ─────────────────────────────────────────────────

	@Get(':schemaSlug/:id')
	findOne(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.findOne(schemaSlug, id);
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

	// ─── Nested ID Routes ─────────────────────────────────────────────────

	@Put(':schemaSlug/:id/restore')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	restore(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.restore(schemaSlug, id);
	}

	@Post(':schemaSlug/:id/duplicate')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.EDITOR)
	duplicate(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.duplicate(schemaSlug, id);
	}

	@Delete(':schemaSlug/:id/permanent')
	@HttpCode(204)
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	permanentlyDelete(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.permanentlyDelete(schemaSlug, id);
	}

	// ─── Version History ────────────────────────────────────────────────────

	@Get(':schemaSlug/:id/versions')
	getVersions(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string
	) {
		return this.contentService.getVersions(schemaSlug, id);
	}

	@Patch(':schemaSlug/:id/versions/:version')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.EDITOR)
	restoreVersion(
		@Param('schemaSlug') schemaSlug: string,
		@Param('id') id: string,
		@Param('version') version: string
	) {
		return this.contentService.restoreVersion(schemaSlug, id, Number(version));
	}
}
