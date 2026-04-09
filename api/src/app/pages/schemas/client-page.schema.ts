import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ClientPage, Block, PageStatus } from '@research-cms/shared-types';

export type ClientPageDocument = HydratedDocument<ClientPageModel>;

@Schema({ timestamps: true })
export class ClientPageModel implements Omit<ClientPage, '_id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true })
  clientId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ type: String, enum: ['draft', 'published'], default: 'draft' })
  status: PageStatus;

  @Prop({ type: String, default: null })
  parentId: string | null;

  @Prop({ type: [Object], default: [] })
  blocks: Block[];
}

export const ClientPageSchema = SchemaFactory.createForClass(ClientPageModel);

// Each client can only have one page per slug (within same type)
ClientPageSchema.index({ clientId: 1, slug: 1 }, { unique: true });
