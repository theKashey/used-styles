import {getProjectStyles, scanProjectStyles} from './scanForStyles'
import {getUsedStyles, getCriticalStyles} from './getCSS';
import {createStyleStream} from "./reporters/used";
import {createCriticalStyleStream} from "./reporters/critical";

import {createLink} from './createLink';
import {setReactOptimization} from "./config";

export {
  getProjectStyles,
  scanProjectStyles,

  getUsedStyles,
  getCriticalStyles,

  createStyleStream,
  createCriticalStyleStream,

  createLink,

  setReactOptimization,
}