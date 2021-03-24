import { getCriticalRules, getCriticalStyles, getUsedStyles } from './getCSS';
import { createCriticalStyleStream } from './reporters/critical';
import { createStyleStream } from './reporters/used';
import { alterProjectStyles, discoverProjectStyles, parseProjectStyles } from './scanForStyles';

import { enableReactOptimization } from './config';
import { createLink } from './createLink';

export { UsedTypes, StyleDefinition } from './types';

export {
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
