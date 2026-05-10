'use client';

import { Block, blockRegistry } from '@research-cms/shared-types';
import { SchemaFieldInput } from './SchemaFieldInput';
import { Text, Toggle } from '@/components/ui';

const compactInput = 'w-full border-2 border-on-surface bg-surface px-2 py-1 font-code text-caption text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

/**
 * Generic block configuration form renderer.
 * Reads the block's definition schema and generates the form dynamically.
 * This is the admin piece of the registry pattern —
 * adding a new block type automatically adds it to the UI.
 */
export function BlockConfigForm({
  block,
  onChange,
  schemaSlug,
  clientId,
}: {
  block: Block;
  onChange: (block: Block) => void;
  schemaSlug?: string;
  clientId?: string;
}) {
  const definition = blockRegistry.get(block.type);

  if (!definition) {
    return (
      <div className="p-4 bg-surface border-2 border-error">
        <Text variant="body-sm" color="error">Unknown block type: {block.type}</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* Block-specific fields — rendered from schema */}
      {definition.schema.fields.map(field => (
        <SchemaFieldInput
          key={field.name}
          field={field}
          value={(block as any)[field.name]}
          onChange={value => onChange({ ...block, [field.name]: value })}
          block={block}
          contextSchemaSlug={schemaSlug}
          clientId={clientId}
        />
      ))}

      {/* Base block properties — same for all blocks */}
      <BaseBlockConfig block={block} onChange={onChange} />
    </div>
  );
}

/**
 * Base block properties that apply to all block types.
 * Includes: visible, padding, margin, backgroundColor, borderRadius, etc.
 */
function BaseBlockConfig({
  block,
  onChange,
}: {
  block: Block;
  onChange: (block: Block) => void;
}) {
  return (
    <div className="border-t-2 border-on-surface pt-2 mt-2">
      <Text variant="caption" color="secondary" className="uppercase tracking-wider font-bold mb-2">
        Properties
      </Text>

      <div className="flex flex-col gap-1.5">
        {/* Visibility toggle */}
        <Toggle
          checked={block.visible ?? true}
          onChange={checked => onChange({ ...block, visible: checked })}
          label="Visible"
        />

        {/* Order (for drag/drop context) */}
        <div>
          <Text variant="caption" color="secondary" as="label" className="block mb-0.5 font-code">Order</Text>
          <input
            type="number"
            className={compactInput}
            value={block.order ?? 0}
            onChange={e => onChange({ ...block, order: Number(e.target.value) })}
          />
        </div>

        {/* Styling */}
        <div className="space-y-1.5 border-t-2 border-on-surface pt-1.5">
          <Text variant="caption" color="secondary" className="uppercase tracking-wider font-bold">Styling</Text>

          <div>
            <Text variant="caption" color="secondary" as="label" className="block mb-0.5 font-code">
              Background
            </Text>
            <div className="flex gap-1">
              <input
                type="color"
                className={`${compactInput} h-8 w-12 cursor-pointer p-0`}
                value={block.backgroundColor ?? '#ffffff'}
                onChange={e =>
                  onChange({
                    ...block,
                    backgroundColor: e.target.value || undefined,
                  })
                }
              />
              <input
                type="text"
                className={`${compactInput} flex-1`}
                value={block.backgroundColor ?? ''}
                onChange={e =>
                  onChange({
                    ...block,
                    backgroundColor: e.target.value || undefined,
                  })
                }
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div>
            <Text variant="caption" color="secondary" as="label" className="block mb-0.5 font-code">
              Border Radius
            </Text>
            <input
              type="number"
              className={compactInput}
              value={block.borderRadius ?? 0}
              onChange={e =>
                onChange({
                  ...block,
                  borderRadius: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-1.5 border-t-2 border-on-surface pt-1.5">
          <Text variant="caption" color="secondary" className="uppercase tracking-wider font-bold">
            Spacing
          </Text>

          <SpacingConfig
            label="Padding"
            value={block.padding}
            onChange={padding => onChange({ ...block, padding })}
          />

          <SpacingConfig
            label="Margin"
            value={block.margin}
            onChange={margin => onChange({ ...block, margin })}
          />
        </div>

        {/* Responsive */}
        <div className="space-y-1 border-t-2 border-on-surface pt-1.5">
          <Text variant="caption" color="secondary" className="uppercase tracking-wider font-bold">
            Responsive
          </Text>
          <div className="flex gap-3 flex-wrap">
            {(['mobile', 'tablet', 'desktop'] as const).map(device => (
              <Toggle
                key={device}
                checked={(block.hideOn ?? []).includes(device)}
                onChange={checked => {
                  const hideOn = block.hideOn ?? [];
                  if (checked) {
                    onChange({
                      ...block,
                      hideOn: [...hideOn, device],
                    });
                  } else {
                    onChange({
                      ...block,
                      hideOn: hideOn.filter(d => d !== device),
                    });
                  }
                }}
                label={device.charAt(0).toUpperCase() + device.slice(1)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Spacing editor sub-component (padding/margin).
 */
function SpacingConfig({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: any;
  onChange: (value: any) => void;
}) {
  const current = value ?? {};

  return (
    <div>
      <Text variant="caption" color="secondary" as="label" className="block mb-1 font-code">{label}</Text>
      <div className="grid grid-cols-4 gap-1">
        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
          <input
            key={side}
            type="number"
            className={compactInput}
            placeholder={side[0].toUpperCase()}
            title={side}
            value={current[side] ?? ''}
            onChange={e => {
              const num = e.target.value ? Number(e.target.value) : undefined;
              onChange({ ...current, [side]: num });
            }}
          />
        ))}
      </div>
      <Text variant="caption" color="secondary" className="mt-0.5">T / R / B / L</Text>
    </div>
  );
}
