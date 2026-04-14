'use client';

import { Block, blockRegistry, BaseBlock } from '@research-cms/shared-types';
import { SchemaFieldInput } from './SchemaFieldInput';

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
}: {
  block: Block;
  onChange: (block: Block) => void;
  schemaSlug?: string;
}) {
  const definition = blockRegistry.get(block.type);

  if (!definition) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        Unknown block type: {block.type}
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
    <div className="border-t border-zinc-200 pt-2 mt-2">
      <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
        Properties
      </p>

      <div className="flex flex-col gap-1.5">
        {/* Visibility toggle */}
        <label className="flex items-center gap-2 cursor-pointer py-0.5">
          <input
            type="checkbox"
            checked={block.visible ?? true}
            onChange={e => onChange({ ...block, visible: e.target.checked })}
            className="w-3 h-3"
          />
          <span className="text-[10px] text-zinc-500 font-mono">Visible</span>
        </label>

        {/* Order (for drag/drop context) */}
        <div>
          <label className="text-[9px] text-zinc-400 font-mono block mb-0.5">Order</label>
          <input
            type="number"
            className="field-input w-full text-xs py-1"
            value={block.order ?? 0}
            onChange={e => onChange({ ...block, order: Number(e.target.value) })}
          />
        </div>

        {/* Styling */}
        <div className="space-y-1.5 border-t border-zinc-100 pt-1.5">
          <p className="text-[9px] uppercase tracking-wider text-zinc-300 font-semibold">Styling</p>

          <div>
            <label className="text-[9px] text-zinc-400 font-mono block mb-0.5">
              Background
            </label>
            <div className="flex gap-1">
              <input
                type="color"
                className="field-input h-8 w-12 cursor-pointer"
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
                className="field-input flex-1 text-xs font-mono py-1"
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
            <label className="text-[9px] text-zinc-400 font-mono block mb-0.5">
              Border Radius
            </label>
            <input
              type="number"
              className="field-input w-full text-xs py-1"
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
        <div className="space-y-1.5 border-t border-zinc-100 pt-1.5">
          <p className="text-[9px] uppercase tracking-wider text-zinc-300 font-semibold">
            Spacing
          </p>

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
        <div className="space-y-1 border-t border-zinc-100 pt-1.5">
          <p className="text-[9px] uppercase tracking-wider text-zinc-300 font-semibold">
            Responsive
          </p>
          <div className="flex gap-1 flex-wrap">
            {(['mobile', 'tablet', 'desktop'] as const).map(device => (
              <label key={device} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={(block.hideOn ?? []).includes(device)}
                  onChange={e => {
                    const hideOn = block.hideOn ?? [];
                    if (e.target.checked) {
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
                  className="w-3 h-3"
                />
                <span className="text-[9px] text-zinc-500 font-mono capitalize">
                  {device}
                </span>
              </label>
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
      <label className="text-[9px] text-zinc-400 font-mono block mb-1">{label}</label>
      <div className="grid grid-cols-4 gap-1">
        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
          <input
            key={side}
            type="number"
            className="field-input w-full text-xs py-1"
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
      <p className="text-[8px] text-zinc-400 mt-0.5">T / R / B / L</p>
    </div>
  );
}
