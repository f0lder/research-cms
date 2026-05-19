import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MenuItemType } from '@research-cms/shared-types';

export type MenuDocument = HydratedDocument<MenuModel>;

@Schema({ timestamps: true })
export class MenuModel {
  @Prop({ required: true })
  clientId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  slug!: string;

  @Prop()
  slot?: string;

  @Prop({ type: [{ id: String, label: String, type: String, pageSlug: String, schemaSlug: String, entryId: String, archiveSchema: String, url: String, order: Number }], default: [] })
  items!: {
    id: string;
    label: string;
    type: MenuItemType;
    pageSlug?: string;
    schemaSlug?: string;
    entryId?: string;
    archiveSchema?: string;
    url?: string;
    order: number;
  }[];
}

export const MenuSchema = SchemaFactory.createForClass(MenuModel);
MenuSchema.index({ clientId: 1, slug: 1 }, { unique: true });
