import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Block, PAGE_SCHEMA_SLUG } from '@research-cms/shared-types';

export type ClientPageDocument = HydratedDocument<ClientPageModel>;

/**
 * @deprecated Pages are now managed directly through the page schema.
 * This model is kept for backwards compatibility if needed.
 */
@Schema({ timestamps: true })
export class ClientPageModel {
  @Prop({ required: true, index: true })
  clientId: string;

  /**
   * Reference to an entry in the page schema.
   * The page data (title, slug, description, etc.) comes from this entry.
   * This allows Field blocks to access page fields consistently with other schemas.
   */
  @Prop({ required: true, ref: PAGE_SCHEMA_SLUG })
  entryId: string;

  @Prop({ type: [Object], default: [] })
  blocks: Block[];
}

export const ClientPageSchema = SchemaFactory.createForClass(ClientPageModel);

// Each client can only have one page per entry (prevent duplicate layouts for same page)
ClientPageSchema.index({ clientId: 1, entryId: 1 }, { unique: true });
