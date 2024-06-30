import { enableReactOptimization } from './config';
import { createLink } from './createLink';
import { getCriticalRules, extractCriticalRules, getCriticalStyles, getUsedStyles } from './getCSS';
import { alterProjectStyles } from './operations';
import { createCriticalStyleStream } from './reporters/critical';
import { createStyleStream } from './reporters/used';
import { loadStyleDefinitions, parseProjectStyles } from './style-operations';
import { createUsedFilter as createUsedSelectorsFilter } from './utils/cache';

/**
 * @deprecated please import discoverProjectStyles from 'used-styles/node'
 */
export const discoverProjectStyles = () => {
  throw new Error("Please import discoverProjectStyles from 'used-styles/node'");
};

export { serializeStylesLookup, loadSerializedLookup } from './serialize';
export { UsedTypes, StyleDefinition, SelectionFilter } from './types';
export {
  createUsedSelectorsFilter,
  loadStyleDefinitions,
  parseProjectStyles,
  alterProjectStyles,
  getUsedStyles,
  getCriticalStyles,
  getCriticalRules,
  extractCriticalRules,
  createStyleStream,
  createCriticalStyleStream,
  createLink,
  enableReactOptimization,
};
