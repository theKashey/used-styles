import { StyleSelector } from '../parser/ast';
import { CacheLine } from '../types';

export const createLine = (): CacheLine => ({
  tail: '',
});

export const createUsedFilter = () => {
  const usedSelectors = new Set<string>();

  return (_: any, rule: StyleSelector) => {
    if (usedSelectors.has(rule.hash)) {
      return false;
    }
    usedSelectors.add(rule.hash);
    return true;
  };
};
