import { v4 as uuidv4 } from 'uuid';
import { Block, ContentTypeDefinition, createFieldBlock } from '@research-cms/shared-types';

export function bootstrapFromSchema(schema: Pick<ContentTypeDefinition, 'fields'>): Block[] {
  return schema.fields.map((f, i) => createFieldBlock({
    id: uuidv4(),
    fieldName: f.name,
    label: f.label,
    fieldType: f.type,
    visible: true,
    order: i,
  }));
}

export function syncWithSchema(
  schema: Pick<ContentTypeDefinition, 'fields'>,
  saved: unknown[] | null,
): Block[] {
  if (!saved || saved.length === 0) return bootstrapFromSchema(schema);

  const fieldMap = new Map(schema.fields.map(f => [f.name, f]));
  const retained: Block[] = [];

  for (const b of saved as Block[]) {
    if (b.type === 'field') {
      const fieldName = b.fieldName;
      if (!fieldName) continue;

      const f = fieldMap.get(fieldName);
      if (!f) continue;

      retained.push(createFieldBlock({
        id: b.id,
        fieldName,
        label: f.label,
        fieldType: f.type,
        visible: b.visible,
        order: b.order,
        showLabel: b.showLabel,
        labelPosition: b.labelPosition,
      }));
    } else {
      retained.push(b);
    }
  }

  return retained;
}
