import { StyleSelector } from '../parser/ast';
import { CacheLine } from '../types';

export const createLine = (): CacheLine => ({
  tail: '',
});

export const createUsedFilter = () => {
  const usedSelectors = new Set<string>();

  return (_: any, rule: StyleSelector) => {
    // if rule is already seen - skip
    if (usedSelectors.has(rule.hash)) {
      return false;
    }

    // if one of the parents of this rule has not been introduced yed - skip
    const parents = rule.parents;

    if (parents) {
      if (!parents.every((parent) => usedSelectors.has(parent))) {
        return false;
      }
    }

    usedSelectors.add(rule.hash);

    return true;
  };
};
