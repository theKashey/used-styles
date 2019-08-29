import {StyleDefinition, UsedTypes, UsedTypesRef} from "./types";
import {fromAst} from "./parser/fromAst";
import {getStylesInText} from "./utils";

export const getUsedStyles = (str: string, {lookup}: StyleDefinition): UsedTypes => (
  Object.keys(
    getStylesInText(str).reduce((styles, className) => {
      const classes = className.split(' ');
      classes.forEach(singleClass => {
        const files = lookup[singleClass];
        if (files) {
          files.forEach((file: string) => styles[file] = true);
        }
      });
      return styles;
    }, {} as UsedTypesRef)
  )
);

export const astToStyles = (styles: string[], def: StyleDefinition, filter?: (selector: string) => boolean): string => {
  const {lookup, ast} = def;
  const fetches = {};
  styles.forEach(className => {
    const classes = className.split(' ');
    const affected: Record<string, boolean> = {};
    classes.forEach(singleClass => {
      const files = lookup[singleClass];
      if (files) {
        files.forEach(file => affected[file] = true);
      }
    });
    Object.keys(affected).forEach(file => {
      if (!fetches[file]) {
        fetches[file] = [];
      }
      fetches[file].push(className);
    });
  });

  console.log(fetches);

  return (
    Object
      .keys(ast)
      .filter(file => !!fetches[file])
      .map(file => fromAst(fetches[file], ast[file], filter))
      .join('\n')
  );
};


export const getCriticalStyles = (str: string, def: StyleDefinition, filter?: (selector: string) => boolean): string => (
  astToStyles(getStylesInText(str), def, filter)
);