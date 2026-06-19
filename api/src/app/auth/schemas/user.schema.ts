import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
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
}

export const UserSchema = SchemaFactory.createForClass(User);
