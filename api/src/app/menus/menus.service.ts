import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuModel, MenuDocument } from './schemas/menu.schema';

@Injectable()
export class MenusService {
  constructor(
    @InjectModel(MenuModel.name) private model: Model<MenuDocument>,
  ) {}

  async findAll(clientId: string): Promise<MenuDocument[]> {
    return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(clientId: string, id: string): Promise<MenuDocument> {
    const menu = await this.model.findOne({ _id: id, clientId }).exec();
    if (!menu) throw new NotFoundException('Menu not found');
    return menu;
  }

  async create(clientId: string, data: { name: string; slug: string; slot?: string; items?: MenuDocument['items'] }): Promise<MenuDocument> {
    return this.model.create({ clientId, ...data });
  }

  async update(clientId: string, id: string, data: Partial<Pick<MenuDocument, 'name' | 'slug' | 'slot' | 'items'>>): Promise<MenuDocument> {
    const menu = await this.model.findOne({ _id: id, clientId }).exec();
    if (!menu) throw new NotFoundException('Menu not found');
    if (data.name !== undefined) menu.name = data.name;
    if (data.slug !== undefined) menu.slug = data.slug;
    if (data.slot !== undefined) menu.slot = data.slot;
    if (data.items !== undefined) {
      menu.items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
    }
    return menu.save();
  }

  async delete(clientId: string, id: string): Promise<void> {
    const result = await this.model.deleteOne({ _id: id, clientId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Menu not found');
  }

  async findBySlot(clientId: string, slot: string): Promise<MenuDocument | null> {
    return this.model.findOne({ clientId, slot }).exec();
  }
}
