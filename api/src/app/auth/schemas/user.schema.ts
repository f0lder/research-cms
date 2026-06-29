import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  /** End-user (reader) account for a mobile/web client app — not a CMS staff role. */
  USER = 'user',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.EDITOR })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  firstName: string;

  @Prop({ default: '' })
  lastName: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  website: string;

  @Prop({ default: '' })
  avatarUrl: string;

  /** Project (Client) this end-user account was registered under. Null for staff accounts. */
  @Prop({ type: Types.ObjectId, ref: 'ApiKeyModel', default: null })
  clientId: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
// Staff accounts (clientId: null) stay globally unique by email; end users are
// unique per project, so the same email can read multiple separate client apps.
UserSchema.index({ email: 1, clientId: 1 }, { unique: true });
