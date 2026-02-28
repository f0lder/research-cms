export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  IMAGE = 'image',
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
}

export interface ContentTypeDefinition {
  _id?: string;
  name: string;
  slug: string;
  fields: FieldDefinition[];
}