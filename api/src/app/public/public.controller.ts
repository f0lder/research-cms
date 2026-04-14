import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { PagesService } from '../pages/pages.service';
import { LayoutsService } from '../layouts/layouts.service';
import { SchemaService } from '../schema/schema.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { Block, LayoutBlock } from '@research-cms/shared-types';

type PublicRequest = Request & {
  clientId: string;
  homePageId: string | null;
  apiKeyAllowedSchemas: string[];
  clientLayouts: Map<string, LayoutBlock[]>;
};

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly pagesService: PagesService,
    private readonly layoutsService: LayoutsService,
    private readonly schemaService: SchemaService,
  ) {}

  @Get()
  listSchemas(@Req() req: PublicRequest) {
    return this.publicService.listSchemas(req.apiKeyAllowedSchemas);
  }

  // ── Pages (declared before :schemaSlug to avoid param capture) ──────────────

  @Get('pages')
  async listPages(@Req() req: PublicRequest) {
    const pages = await this.pagesService.findAllForClient(req.clientId);
    return pages.map(p => {
      const blocksData = p.data?.blocks;
      let blocks: Block[] = [];
      try {
        blocks = typeof blocksData === 'string' ? JSON.parse(blocksData) : (Array.isArray(blocksData) ? blocksData : []);
      } catch {
        // If blocks aren't valid JSON, use empty array
      }
      return {
        _id: p._id,
        schemaSlug: p.schemaSlug,
        data: p.data,
        blocks,
        isHome: req.homePageId ? p._id === req.homePageId : false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }

  @Get('pages/:slug')
  async getPage(
    @Param('slug') slug: string,
    @Req() req: PublicRequest,
  ) {
    const page = await this.pagesService.findBySlug(req.clientId, slug);
    
    // Parse blocks from page.data.blocks (JSON string)
    const blocksData = page.data?.blocks;
    let blocks: Block[] = [];
    try {
      blocks = typeof blocksData === 'string' ? JSON.parse(blocksData) : (Array.isArray(blocksData) ? blocksData : []);
    } catch {
      // If blocks aren't valid JSON, use empty array
    }

    // Resolve all blocks, fetching data and applying layouts
    const resolvedBlocks = await this.pagesService.resolveBlocks(
      blocks,
      req.clientLayouts ?? new Map(),
    );

    return {
      _id: page._id,
      schemaSlug: page.schemaSlug,
      data: page.data,
      blocks: resolvedBlocks,
      isHome: req.homePageId ? page._id === req.homePageId : false,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  // ── Entry Layouts ────────────────────────────────────────────────────────────

  @Get('layouts/:schemaSlug')
  async getEntryLayout(@Param('schemaSlug') schemaSlug: string) {
    const saved = await this.layoutsService.findOne(schemaSlug);
    // Return the stored layout (blocks are Block[])
    return {
      schemaSlug,
      blocks: saved?.blocks ?? [],
    };
  }

  // ── Schema content ───────────────────────────────────────────────────────────

  @Get(':schemaSlug')
  findAll(
    @Param('schemaSlug') schemaSlug: string,
    @Req() req: PublicRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicService.findAll(
      schemaSlug,
      Number(page) || 1,
      Number(limit) || 50,
      req.clientLayouts ?? new Map(),
    );
  }

@Get(':schemaSlug/search')
	async search(
		@Param('schemaSlug') schemaSlug: string,
		@Query('q') query?: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Req() req?: PublicRequest,
	) {
		return this.publicService.search(
			schemaSlug,
			query || '',
			Number(page) || 1,
			Number(limit) || 20,
		);
	}

	@Get(':schemaSlug/:id')
  findOne(
    @Param('schemaSlug') schemaSlug: string,
    @Param('id') id: string,
    @Req() req: PublicRequest,
  ) {
    return this.publicService.findOne(
      schemaSlug,
      id,
      req.apiKeyAllowedSchemas,
      req.clientLayouts ?? new Map(),
    );
  }
}
