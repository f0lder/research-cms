import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BlockLayout, Block } from '@research-cms/shared-types';

export type BlockLayoutDocument = HydratedDocument<BlockLayoutModel>;

@Schema({ timestamps: true })
export class BlockLayoutModel implements BlockLayout {
  @Prop({ required: true, unique: true })
  schemaSlug: string;

  @Prop({ type: [Object], default: [] })
  blocks: Block[];
}

export const BlockLayoutSchema = SchemaFactory.createForClass(BlockLayoutModel);
