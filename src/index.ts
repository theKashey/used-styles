import {discoverProjectStyles, parseProjectStyles, alterProjectStyles} from './scanForStyles'
import {getUsedStyles, getCriticalStyles, getCriticalRules} from './getCSS';
import {createStyleStream} from "./reporters/used";
import {createCriticalStyleStream} from "./reporters/critical";

import {createLink} from './createLink';
import {enableReactOptimization} from "./config";

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
}