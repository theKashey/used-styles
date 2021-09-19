import { getCriticalRules, getCriticalStyles, getUsedStyles } from './getCSS';
import { alterProjectStyles } from './operations';
import { createCriticalStyleStream } from './reporters/critical';
import { createStyleStream } from './reporters/used';
import { discoverProjectStyles, loadStyleDefinitions, parseProjectStyles } from './scanForStyles';

import { enableReactOptimization } from './config';
import { createLink } from './createLink';
import { createUsedFilter as createUsedSelectorsFilter } from './utils/cache';

export { UsedTypes, StyleDefinition } from './types';

export {
  createUsedSelectorsFilter,
  loadStyleDefinitions,
  discoverProjectStyles,
  parseProjectStyles,
  alterProjectStyles,
  getUsedStyles,
  getCriticalStyles,
  getCriticalRules,
  createStyleStream,
  createCriticalStyleStream,
  createLink,
  enableReactOptimization,
};
