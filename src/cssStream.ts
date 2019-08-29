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

export const getCriticalStyles = (str: string, {ast}: StyleDefinition): string => (
  fromAst(getStylesInText(str), ast)
);