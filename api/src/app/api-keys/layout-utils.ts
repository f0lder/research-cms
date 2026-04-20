import { v4 as uuidv4 } from 'uuid';
import { Block, ContentTypeDefinition } from '@research-cms/shared-types';

/** Build a default field-block layout from a schema's fields. */
export function bootstrapFromSchema(schema: Pick<ContentTypeDefinition, 'fields'>): Block[] {
  return schema.fields.map((f, i) => ({
    id: uuidv4(),
    type: 'field' as const,
    fieldName: f.name,
    label: f.label,
    fieldType: f.type,
    value: null,
    visible: true,
    order: i,
    showLabel: true,
    labelPosition: 'above' as const,
  }) as unknown as Block);
}

/**
 * Reconcile a saved block list with the current schema fields:
 * - keep non-field blocks as-is
 * - update field blocks' label/fieldType from schema; drop blocks whose field no longer exists
 * - migrate legacy `config.fieldName` → top-level `fieldName`
 * Returns a bootstrapped layout when nothing is saved.
 */
export function syncWithSchema(
  schema: Pick<ContentTypeDefinition, 'fields'>,
  saved: unknown[] | null,
): Block[] {
  if (!saved || saved.length === 0) return bootstrapFromSchema(schema);

  const fieldMap = new Map(schema.fields.map(f => [f.name, f]));
  const retained: Block[] = [];

  for (const b of saved as Array<Record<string, unknown> & { type: string }>) {
    if (b.type === 'field') {
      const config = (b.config ?? {}) as { fieldName?: string };
      const fieldName = (b.fieldName as string | undefined) || config.fieldName;
      if (!fieldName) continue;

      const f = fieldMap.get(fieldName);
      if (!f) continue; // field was removed from the schema — drop this block

      retained.push({
        id: b.id as string,
        type: 'field' as const,
        fieldName,
        label: f.label,
        fieldType: f.type,
        value: (b.value ?? null) as never,
        visible: b.visible !== false,
        order: (b.order as number | undefined) ?? 0,
        showLabel: (b.showLabel as boolean | undefined) ?? true,
        labelPosition: (b.labelPosition as 'above' | 'inline' | undefined) ?? 'above',
      } as unknown as Block);
    } else {
      retained.push(b as unknown as Block);
    }
  }

  return retained;
}
