import {getProjectStyles} from './scanForStyles'
import {getUsedStyles, getCriticalStyles} from './cssStream';
import {createStyleStream} from "./reporters/used";
import {createCriticalStyleStream} from "./reporters/critical";

import {createLink} from './createLink';
import {setReactOptimization} from "./config";

export {
  getProjectStyles,

  getUsedStyles,
  getCriticalStyles,

  createStyleStream,
  createCriticalStyleStream,

  createLink,

  setReactOptimization,
}