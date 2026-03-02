import type { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

/**
 * Migrates a raw (possibly flat) config to the canonical nested PowerFlowCardPlusConfig shape.
 *
 * Flat format (legacy): entities.grid has an 'entity' key at the top level.
 * Nested format (current): entities.grid has 'house' and/or 'main' sub-keys.
 *
 * This function is idempotent: calling it multiple times on an already-migrated
 * config returns the exact same object reference without any modification.
 *
 * @param raw - Unknown input (typically the raw config object from setConfig)
 * @returns PowerFlowCardPlusConfig with nested grid shape guaranteed
 */
export function migrateConfig(raw: unknown): PowerFlowCardPlusConfig {
  const config = raw as PowerFlowCardPlusConfig;
  const grid = config?.entities?.grid as Record<string, unknown> | undefined;

  // Detection: flat format has 'entity' key at top level of grid object
  if (grid !== undefined && "entity" in grid) {
    console.warn(
      "[power-flow-card-plus] entities.grid has been migrated to entities.grid.house automatically. Update your config to suppress this warning."
    );

    // Migration: wrap the original grid object under the 'house' sub-key
    return {
      ...config,
      entities: {
        ...config.entities,
        grid: { house: grid as any },
      },
    };
  }

  // Idempotency: already nested (or no grid) — return same reference
  return config;
}
