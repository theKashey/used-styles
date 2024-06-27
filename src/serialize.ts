import type { StyleDefinition, SerializedStyleDefinition } from './types';
import { assertIsReady } from './utils/async';

export function serializeStylesLookup(def: StyleDefinition): SerializedStyleDefinition {
  assertIsReady(def);

  return {
    lookup: def.lookup,
    ast: def.ast,
    urlPrefix: def.urlPrefix,
  };
}

export function deserializeStylesLookup(def: SerializedStyleDefinition): StyleDefinition {
  return {
    isReady: true,
    lookup: def.lookup,
    ast: def.ast,
    urlPrefix: def.urlPrefix,
    /**
     * Serialized style definition is already ready,
     * so `then` here is just a noop for compatibility
     */
    then: (res) => {
      if (res) {
        res();
      }

      return Promise.resolve();
    },
  };
}
