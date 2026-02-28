import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { ContentTypeDefinition } from '@research-cms/shared-types';

@Controller('schemas')
export class SchemaController {
	constructor(private readonly schemaService: SchemaService) { }

	@Post()
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
	update(
		@Param('slug') slug: string,
		@Body() data: Partial<ContentTypeDefinition>
	) {
		return this.schemaService.update(slug, data);
	}

	@Delete(':slug')
	delete(@Param('slug') slug: string) {
		return this.schemaService.delete(slug);
	}
}