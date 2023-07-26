import { StyleSelector } from '../parser/ast';
import { CacheLine, SelectionFilter } from '../types';

export const createLine = (): CacheLine => ({
  tail: '',
});

export const createUsedFilter = (): SelectionFilter => {
  const usedSelectors = new Set<string>();
  const knownClasses = new Set<string>();

  const filter: SelectionFilter = (_: any, rule: StyleSelector) => {
    // if rule is already seen - skip
    if (usedSelectors.has(rule.hash)) {
      return false;
    }

    // if one of the parents of this rule has not been introduced yed - skip
    const parents = rule.parents;

    if (parents) {
      if (!parents.every((parent) => knownClasses.has(parent))) {
        return false;
      }
    }

    usedSelectors.add(rule.hash);

    return true;
  };

  filter.introduceClasses = (classes) => classes.forEach((cl) => knownClasses.add(cl));

  return filter;
};
