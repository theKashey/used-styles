import { kashe } from 'kashe';

import { StyleAst } from './parser/ast';
import { extractUnmatchable, fromAst, getUnmatchableRules } from './parser/fromAst';
import { FlagType, SelectionFilter, StyleChunk, StyleDefinition, UsedTypes, UsedTypesRef } from './types';
import { assertIsReady } from './utils/async';
import { createUsedFilter } from './utils/cache';
import { unique } from './utils/order';
import { flattenClasses, getStylesInText } from './utils/string';

export const getUnusableStyles = kashe(
  (def: StyleDefinition): UsedTypesRef =>
    Object.keys(def.ast || {})
      .filter((key) => getUnmatchableRules(def.ast[key]).length > 0)
      .reduce((acc, file) => {
        acc[file] = true;

        return acc;
      }, {} as UsedTypesRef)
);

export const astToUsedStyles = kashe((styles: string[], def: StyleDefinition) => {
  const { lookup, ast } = def;
  const fetches: Record<string, FlagType> = {};
  const visitedStyles = new Set<string>();

  styles.forEach((className) => {
    if (visitedStyles.has(className)) {
      return;
    }

    visitedStyles.add(className);

    const classes = className.split(' ');

    classes.forEach((singleClass) => {
      if (lookup.hasOwnProperty(singleClass)) {
        const files = lookup[singleClass];

        files.forEach((file) => {
          if (!fetches[file]) {
            fetches[file] = {};
          }

          fetches[file][singleClass] = true;
        });
      }
    });
  });

  return {
    fetches,
    usage: Object.keys(ast).filter((file) => !!fetches[file]),
  };
});

const getUsedStylesIn = kashe((styles: string[], def: StyleDefinition): UsedTypes => {
  assertIsReady(def);

  const { usage } = astToUsedStyles(styles, def);
  const flags: FlagType = {
    ...getUnusableStyles(def),
    ...usage.reduce((acc, file) => {
      acc[file] = true;

      return acc;
    }, {} as FlagType),
  };

  return Object.keys(
    Object.keys(def.ast).reduce((acc, file) => {
      if (flags[file]) {
        acc[file] = true;
      }

      return acc;
    }, {} as FlagType)
  );
});

/**
 * returns names of the style files for a given HTML and style definitions
 */
export const getUsedStyles = (htmlCode: string, def: StyleDefinition): UsedTypes => {
  assertIsReady(def);

  return getUsedStylesIn(getStylesInText(htmlCode), def);
};

const astToStyles = kashe((styles: string[], def: StyleDefinition, filter?: SelectionFilter): StyleChunk[] => {
  const { ast } = def;
  const { fetches, usage } = astToUsedStyles(styles, def);

  if (filter && filter.introduceClasses) {
    filter.introduceClasses(flattenClasses(styles));
  }

  return usage.map((file) => ({
    file,
    css: fromAst(Object.keys(fetches[file]), ast[file], filter),
  }));
});

export const wrapInStyle = (styles: string, usedStyles: string[] = []) =>
  styles
    ? `<style type="text/css" data-used-styles="${
        usedStyles.length === 0 ? 'true' : usedStyles.join(',')
      }">${styles}</style>`
    : '';

export const extractUnmatchableFromAst = kashe((ast: StyleAst, filter?: SelectionFilter): StyleChunk[] =>
  Object.keys(ast || {})
    .map((file) => {
      const css = extractUnmatchable(ast[file], filter);

      if (css) {
        return {
          file,
          css,
        } as StyleChunk;
      }

      return undefined;
    })
    .filter((x) => !!x)
    .map((x) => x as StyleChunk)
);

export const extractAllUnmatchable = (def: StyleDefinition, filter?: SelectionFilter): StyleChunk[] =>
  extractUnmatchableFromAst(def.ast, filter);

export const extractAllUnmatchableAsString = kashe((def: StyleDefinition) =>
  wrapInStyle(
    extractAllUnmatchable(def).reduce((acc, { css }) => acc + css, ''),
    ['_unmatched']
  )
);

/**
 * just wraps with <style
 */
const criticalRulesToStyle = (styles: StyleChunk[], urlPrefix = ''): string =>
  wrapInStyle(styles.map(({ css }) => css).join(''), unique(styles.map(({ file }) => `${urlPrefix}${file}`)));

export const criticalStylesToString = (html: string, def: StyleDefinition, filter?: SelectionFilter): string => {
  assertIsReady(def);

  return criticalRulesToStyle(astToStyles(getStylesInText(html), def, filter), def.urlPrefix);
};

const getRawCriticalRules = (html: string, def: StyleDefinition, filter?: SelectionFilter) => {
  assertIsReady(def);

  return astToStyles(getStylesInText(html), def, filter);
};

/**
 * returns critical rules(selector) used in a given HTML code, including unmatchable rules, which can be used indirectly
 * for example `:root`.
 * @see {@link extractCriticalRules} for chunk-based operations
 */
export const getCriticalRules = (
  html: string,
  def: StyleDefinition,
  filter: SelectionFilter = createUsedFilter()
): string => {
  assertIsReady(def);

  return [...extractAllUnmatchable(def, filter), ...getRawCriticalRules(html, def, filter)]
    .map(({ css, file }) => `\n/* ${file} */\n${css}`)
    .join('');
};

/**
 * returns critical rules explicitly used in a given HTML code
 * @see {@link getCriticalRules} for more complete solution, including unmatchable rules as well
 */
export const extractCriticalRules = (
  html: string,
  def: StyleDefinition,
  filter: SelectionFilter = createUsedFilter()
): string => {
  assertIsReady(def);

  return getRawCriticalRules(html, def, filter)
    .map(({ css, file }) => `\n/* ${file} */\n${css}`)
    .join('');
};

/**
 * Generates "ready for use" styles for a given HTML
 * @see {@link getCriticalRules} for lower level API
 * @param html
 * @param def
 * @param filter
 */
export const getCriticalStyles = (
  html: string,
  def: StyleDefinition,
  filter: SelectionFilter = createUsedFilter()
): string => {
  assertIsReady(def);

  return criticalRulesToStyle(
    [...extractAllUnmatchable(def, filter), ...getRawCriticalRules(html, def, filter)],
    def.urlPrefix
  );
};
