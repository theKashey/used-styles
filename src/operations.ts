import { pruneSelector } from './operations/prune-selector';
import { StyleAst } from './parser/ast';
import { StyleDefinition } from './types';
import { assertIsReady } from './utils/async';

export interface AlterOptions {
  /**
   * filters available styles sources/files
   * @param fileName
   */
  filter?(fileName: string): boolean;

  /**
   * filters available rule
   * @param styleName
   */
  pruneSelector?(selector: string): boolean;
}

/**
 * generates an altered subset of styles
 * @param def style definitions
 * @param options a filter function
 * @example
 * ```ts
 * const newStyles = alterProjectStyles(styles, { filter: (fileName) => fileName.indexOf('keep-only-this-file.css') !== 0 })
 * ```
 */
export const alterProjectStyles = (def: StyleDefinition, options: AlterOptions): StyleDefinition => {
  assertIsReady(def);

  return {
    ...def,
    ast: Object.keys(def.ast).reduce((acc, file) => {
      const astFile = def.ast[file];
      const shouldRemove = options.filter && !options.filter(file);

      // dont add this file to the result file list
      if (shouldRemove) {
        return acc;
      }

      acc[file] = options.pruneSelector ? pruneSelector(astFile, options.pruneSelector) : astFile;

      return acc;
    }, {} as StyleAst),
  };
};
