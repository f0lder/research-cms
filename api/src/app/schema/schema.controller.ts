import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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
}