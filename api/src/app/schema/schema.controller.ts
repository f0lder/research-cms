import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('schemas')
@UseGuards(JwtAuthGuard)
export class SchemaController {
	constructor(private readonly schemaService: SchemaService) { }

	@Post()
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	create(@Body() data: ContentTypeDefinition) {
		return this.schemaService.create(data);
	}

	@Get()
	findAll() {
		return this.schemaService.findAll();
	}

	@Get(':slug')
	findOne(@Param('slug') slug: string) {
		return this.schemaService.findOne(slug);
	}

	@Put(':slug')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	update(
		@Param('slug') slug: string,
		@Body() data: Partial<ContentTypeDefinition>
	) {
		return this.schemaService.update(slug, data);
	}

	@Delete(':slug')
	@HttpCode(204)
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	delete(@Param('slug') slug: string) {
		return this.schemaService.delete(slug);
	}
}