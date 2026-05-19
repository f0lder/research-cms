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

  @Prop({ type: [{
    id: { type: String },
    label: { type: String },
    type: { type: String, enum: ['page', 'entry', 'archive', 'external'] },
    pageSlug: { type: String },
    schemaSlug: { type: String },
    entryId: { type: String },
    archiveSchema: { type: String },
    url: { type: String },
    order: { type: Number },
  }], default: [] })
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
