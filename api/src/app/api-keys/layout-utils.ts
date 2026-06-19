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

  function syncBlock(b: Block): Block {
    if (b.type === 'field') {
      const fieldName = b.fieldName;
      if (!fieldName) return b;

      const f = fieldMap.get(fieldName);
      if (!f) return b;

      return createFieldBlock({
        id: b.id,
        fieldName,
        label: f.label,
        fieldType: f.type,
        visible: b.visible,
        order: b.order,
        showLabel: b.showLabel,
        labelPosition: b.labelPosition,
      });
    }

    if (b.type === 'row') {
      const row = b as any;
      if (Array.isArray(row.columns)) {
        return {
          ...row,
          columns: row.columns.map((col: any) => ({
            ...col,
            blocks: Array.isArray(col.blocks)
              ? col.blocks.map((cb: Block) => syncBlock(cb))
              : col.blocks,
          })),
        };
      }
    }

    if ((b.type === 'column' || b.type === 'card') && Array.isArray((b as any).blocks)) {
      return {
        ...b,
        blocks: (b as any).blocks.map((cb: Block) => syncBlock(cb)),
      };
    }

    return b;
  }

  return (saved as Block[]).map(b => syncBlock(b));
}
