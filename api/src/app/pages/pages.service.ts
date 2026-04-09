import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientPageModel, ClientPageDocument } from './schemas/client-page.schema';
import { Block, PageStatus } from '@research-cms/shared-types';

export interface PageData {
  title: string;
  slug: string;
  status?: PageStatus;
  blocks?: Block[];
  parentId?: string | null;
}

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(ClientPageModel.name) private model: Model<ClientPageDocument>,
  ) {}

  private validateSlug(slug: string): void {
    if (!/^[a-z0-9_-]+$/.test(slug)) {
      throw new BadRequestException('Slug must contain only lowercase letters, numbers, hyphens and underscores');
    }
  }

  async findAllForClient(clientId: string): Promise<ClientPageDocument[]> {
    return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
  }

  async findPublishedForClient(clientId: string): Promise<ClientPageDocument[]> {
    return this.model.find({ clientId, status: 'published' }).sort({ createdAt: 1 }).exec();
  }

  async findOne(clientId: string, pageId: string): Promise<ClientPageDocument> {
    const doc = await this.model.findOne({ _id: pageId, clientId }).exec();
    if (!doc) throw new NotFoundException('Page not found');
    return doc;
  }

  async findBySlug(clientId: string, slug: string): Promise<ClientPageDocument> {
    const doc = await this.model.findOne({ clientId, slug, status: 'published' }).exec();
    if (!doc) throw new NotFoundException('Page not found');
    return doc;
  }

  async create(clientId: string, data: PageData): Promise<ClientPageDocument> {
    this.validateSlug(data.slug);
    try {
      return await this.model.create({
        clientId,
        ...data,
        blocks: data.blocks ?? [],
        parentId: data.parentId ?? null,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException(`A page with slug "${data.slug}" already exists for this client`);
      }
      throw new BadRequestException(err.message);
    }
  }

  async update(clientId: string, pageId: string, data: Partial<PageData>): Promise<ClientPageDocument> {
    if (data.slug) this.validateSlug(data.slug);
    try {
      const doc = await this.model.findOneAndUpdate(
        { _id: pageId, clientId },
        { $set: data },
        { returnDocument: 'after' },
      ).exec();
      if (!doc) throw new NotFoundException('Page not found');
      return doc;
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException(`A page with slug "${data.slug}" already exists for this client`);
      }
      throw err;
    }
  }

  async delete(clientId: string, pageId: string): Promise<void> {
    const result = await this.model.findOneAndDelete({ _id: pageId, clientId }).exec();
    if (!result) throw new NotFoundException('Page not found');
    // Unparent any children of the deleted page (promote them to top level)
    await this.model.updateMany({ clientId, parentId: pageId }, { $set: { parentId: null } }).exec();
  }

  async deleteAllForClient(clientId: string): Promise<void> {
    await this.model.deleteMany({ clientId }).exec();
  }
}
