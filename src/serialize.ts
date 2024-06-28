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

export function loadSerializedLookup(def: SerializedStyleDefinition): StyleDefinition {
  assertValidLookup(def);

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

function assertValidLookup(def: any): asserts def is SerializedStyleDefinition {
  if (typeof def === 'string') {
    throw new Error(
      'used-styles: got a string instead of serialized style definition object, make sure to parse it back to JS object first'
    );
  }

  if (!('lookup' in def) || typeof def.lookup !== 'object') {
    throw new Error('used-styles: serialized style definition should be created with serializeStylesLookup');
  }
}
