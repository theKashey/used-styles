import { kashe } from 'kashe';
import { extractUnmatchable, fromAst, getUnmatchableRules } from './parser/fromAst';
import { FlagType, StyleChunk, StyleDefinition, UsedTypes, UsedTypesRef } from './types';
import { assertIsReady, getStylesInText, unique } from './utils';

export const getUnusableStyles = kashe(
  (def: StyleDefinition): UsedTypesRef =>
    Object.keys(def.ast || {})
      .filter(key => getUnmatchableRules(def.ast[key]).length > 0)
      .reduce((acc, file) => {
        acc[file] = true;
        return acc;
      }, {} as UsedTypesRef)
);

export const astToUsedStyles = kashe((styles: string[], def: StyleDefinition) => {
  const { lookup, ast } = def;
  const fetches: Record<string, FlagType> = {};
  const visitedStyles = new Set<string>();

  styles.forEach(className => {
    if (visitedStyles.has(className)) {
      return;
    }
    visitedStyles.add(className);

    const classes = className.split(' ');

    classes.forEach(singleClass => {
      const files = lookup[singleClass];
      if (files) {
        files.forEach(file => {
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
    usage: Object.keys(ast).filter(file => !!fetches[file]),
  };
});

const getUsedStylesIn = kashe(
  (styles: string[], def: StyleDefinition): UsedTypes => {
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
  }
);

export const getUsedStyles = (str: string, def: StyleDefinition): UsedTypes => {
  assertIsReady(def);
  return getUsedStylesIn(getStylesInText(str), def);
};

const astToStyles = kashe(
  (styles: string[], def: StyleDefinition, filter?: (selector: string) => boolean): StyleChunk[] => {
    const { ast } = def;
    const { fetches, usage } = astToUsedStyles(styles, def);

    return usage.map(file => ({
      file,
      css: fromAst(Object.keys(fetches[file]), ast[file], filter),
    }));
  }
);

export const wrapInStyle = (styles: string, usedStyles: string[] = []) =>
  styles
    ? `<style type="text/css" data-used-styles="${
        usedStyles.length === 0 ? 'true' : usedStyles.join(',')
      }">${styles}</style>`
    : '';

export const extractAllUnmatchable = kashe((def: StyleDefinition): StyleChunk[] =>
  Object.keys(def.ast || {})
    .map(file => {
      const css = extractUnmatchable(def.ast[file]);
      if (css) {
        return {
          file,
          css,
        } as StyleChunk;
      }
      return undefined;
    })
    .filter(x => !!x)
    .map(x => x as StyleChunk)
);

export const extractAllUnmatchableAsString = kashe(
  (def: StyleDefinition) =>
    // wrapInStyle(
    extractAllUnmatchable(def).reduce((acc, { css }) => acc + css, '')
  // )
);

const criticalRulesToStyle = (styles: StyleChunk[], urlPrefix = ''): string =>
  wrapInStyle(styles.map(({ css }) => css).join(''), unique(styles.map(({ file }) => `${urlPrefix}${file}`)));

export const criticalStylesToString = (
  str: string,
  def: StyleDefinition,
  filter?: (selector: string) => boolean
): string => {
  assertIsReady(def);
  return criticalRulesToStyle(astToStyles(getStylesInText(str), def, filter), def.urlPrefix);
};

const getRawCriticalRules = (str: string, def: StyleDefinition, filter?: (selector: string) => boolean) => {
  assertIsReady(def);
  return [...extractAllUnmatchable(def), ...astToStyles(getStylesInText(str), def, filter)];
};

export const getCriticalRules = (str: string, def: StyleDefinition, filter?: (selector: string) => boolean): string => {
  assertIsReady(def);
  return getRawCriticalRules(str, def, filter)
    .map(({ css }) => css)
    .join('');
};

export const getCriticalStyles = (str: string, def: StyleDefinition, filter?: (selector: string) => boolean): string =>
  criticalRulesToStyle(getRawCriticalRules(str, def, filter), def.urlPrefix);
