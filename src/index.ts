import { enableReactOptimization } from './config';
import { createLink } from './createLink';
import { getCriticalRules, extractCriticalRules, getCriticalStyles, getUsedStyles } from './getCSS';
import { alterProjectStyles } from './operations';
import { createCriticalStyleStream } from './reporters/critical';
import { createStyleStream } from './reporters/used';
import { discoverProjectStyles, loadStyleDefinitions, parseProjectStyles } from './scanForStyles';

import { createUsedFilter as createUsedSelectorsFilter } from './utils/cache';

export { serializeStylesLookup, loadSerializedLookup } from './serialize';

export { UsedTypes, StyleDefinition, SelectionFilter } from './types';

export {
  createUsedSelectorsFilter,
  loadStyleDefinitions,
  discoverProjectStyles,
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
