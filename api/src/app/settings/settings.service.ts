import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SETTINGS_REGISTRY,
  SettingDefinition,
  SettingScope,
  SettingSchemaView,
  findSettingDefinition,
} from '@research-cms/shared-types';
import { Setting, SettingDocument } from './schemas/setting.schema';

export interface SettingTarget {
  scope: SettingScope;
  scopeId?: string;
  schemaView?: SettingSchemaView;
}

export interface SettingWithDefinition {
  definition: SettingDefinition;
  value: unknown;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  /**
   * Definitions registered for the given scope (filtered by schemaView when scope === 'schema').
   */
  definitionsFor(target: SettingTarget): SettingDefinition[] {
    return SETTINGS_REGISTRY.filter(d => {
      if (d.scope !== target.scope) return false;
      if (d.scope === 'schema') {
        if (!d.schemaView || d.schemaView === 'both') return true;
        return d.schemaView === target.schemaView;
      }
      return true;
    });
  }

  /**
   * List all settings for a target with their stored values (or undefined if unset).
   */
  async list(target: SettingTarget): Promise<SettingWithDefinition[]> {
    const defs = this.definitionsFor(target);
    const stored = await this.settingModel
      .find({
        scope: target.scope,
        scopeId: target.scopeId ?? null,
        schemaView: target.schemaView ?? null,
      })
      .lean()
      .exec();

    const valueByKey = new Map(stored.map(s => [s.key, s.value]));
    return defs.map(definition => ({
      definition,
      value: valueByKey.has(definition.key)
        ? valueByKey.get(definition.key)
        : definition.defaultValue,
    }));
  }

  /**
   * Public-only flat map for the given target — `{ key: value }`.
   * Includes only definitions where `isPublic === true`.
   */
  async listPublic(target: SettingTarget): Promise<Record<string, unknown>> {
    const items = await this.list(target);
    const result: Record<string, unknown> = {};
    for (const { definition, value } of items) {
      if (definition.isPublic) result[definition.key] = value;
    }
    return result;
  }

  /**
   * Upsert a single setting. Validates key against the registry.
   */
  async upsert(
    target: SettingTarget,
    key: string,
    value: unknown,
  ): Promise<void> {
    const def = findSettingDefinition(target.scope, key, target.schemaView);
    if (!def) {
      throw new BadRequestException(
        `Unknown setting "${key}" for scope "${target.scope}"` +
          (target.schemaView ? ` (view: ${target.schemaView})` : ''),
      );
    }
    await this.settingModel.findOneAndUpdate(
      {
        scope: target.scope,
        scopeId: target.scopeId ?? null,
        schemaView: target.schemaView ?? null,
        key,
      },
      { $set: { value } },
      { upsert: true },
    ).exec();
  }

  /**
   * Delete a stored value (revert to default).
   */
  async clear(target: SettingTarget, key: string): Promise<void> {
    await this.settingModel.deleteOne({
      scope: target.scope,
      scopeId: target.scopeId ?? null,
      schemaView: target.schemaView ?? null,
      key,
    }).exec();
  }
}
