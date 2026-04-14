/**
 * Admin app initialization.
 * Runs on app startup to set up the block registry and other global state.
 */
import { registerBuiltInBlocks } from '@research-cms/shared-types';

/**
 * Initialize the admin application.
 * Must be called once on app startup (before any blocks are rendered).
 */
export function initializeAdmin(): void {
  // Register all built-in block types in the shared registry
  registerBuiltInBlocks();
}
