import {kashe} from 'kashe';
import {StyleDefinition, UsedTypes, UsedTypesRef} from "./types";
import {extractUnmatchable, fromAst, getUnmatchableRules} from "./parser/fromAst";
import {assertIsReady, getStylesInText} from "./utils";

export const getUnusableStyles = kashe((def: StyleDefinition): UsedTypesRef => (
  Object
    .keys(def.ast || {})
    .filter(key => getUnmatchableRules(def.ast[key]).length > 0)
    .reduce((acc, file) => {
      acc[file] = true;
      return acc;
    }, {} as UsedTypesRef)
));

export const astToUsedStyles = kashe((styles: string[], def: StyleDefinition) => {
  const {lookup, ast} = def;
  const fetches: Record<string, Record<string, boolean>> = {};
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
          fetches[file][singleClass] = true
        });
      }
    });
  });

  return {
    fetches,
    usage: Object.keys(ast).filter(file => !!fetches[file])
  }
});

export const getUsedStyles = (str: string, def: StyleDefinition): UsedTypes => {
  assertIsReady(def);
  const {usage} = astToUsedStyles(getStylesInText(str), def);
  const flags = {
    ...getUnusableStyles(def),
    ...usage.reduce((acc, file) => {
      acc[file] = true;
      return acc;
    }, {})
  };

  return Object.keys(
    Object
      .keys(def.ast)
      .reduce((acc, file) => {
        if (flags[file]) {
          acc[file] = true
        }
        return acc;
      }, {})
  );
};

export const astToStyles = kashe((styles: string[], def: StyleDefinition, filter?: (selector: string) => boolean): string => {
  const {ast} = def;
  const {fetches, usage} = astToUsedStyles(styles, def);

  return (
    usage
      .map(file => fromAst(Object.keys(fetches[file]), ast[file], filter))
      .join('\n')
  );
});

export const wrapInStyle = (styles: string) => (
  styles
    ? `<style type="text/css" data-used-styles="true">${styles}</style>`
    : ''
);

export const extractAllUnmatchable = kashe((def: StyleDefinition) => (
  Object
    .keys(def.ast || {})
    .reduce((acc, file) => acc + extractUnmatchable(def.ast[file]), '')
));

export const criticalStylesToString = (str: string, def: StyleDefinition, filter?: (selector: string) => boolean): string => {
  assertIsReady(def);
  return astToStyles(getStylesInText(str), def, filter);
};

export const getCriticalRules = (str: string, def: StyleDefinition, filter?: (selector: string) => boolean): string => {
  assertIsReady(def);
  return extractAllUnmatchable(def) + astToStyles(getStylesInText(str), def, filter);
};

export const getCriticalStyles = (str: string, def: StyleDefinition, filter?: (selector: string) => boolean): string => {
  return wrapInStyle(getCriticalRules(str, def, filter));
};