import { StyleAst, StyleSelector } from './parser/ast';

export type StylesLookupTable = Record<string, string[]>;

export interface CacheLine {
  tail: string;
}

export type StyleFiles = Record<string, string>;

export type StyleDef = Record<string, Record<string, boolean>>;
export type UsedTypes = string[];
export type UsedTypesRef = Record<string, boolean>;

export interface AbstractStyleDefinition {
  isReady: boolean;
  lookup: StylesLookupTable;
  ast: Readonly<StyleAst>;
}
export interface SyncStyleDefinition {
  isReady: true;
  lookup: StylesLookupTable;
  ast: Readonly<StyleAst>;
}

export interface StyleChunk {
  file: string;
  css: string;
}

export type FlagType = Record<string, boolean>;

export type StyleDefinition = Readonly<{
  isReady: boolean;
  lookup: Readonly<StylesLookupTable>;
  ast: Readonly<StyleAst>;
  urlPrefix: string;
  then(resolve?: () => void, reject?: () => void): Promise<void>;
}>;

export type SerializedStyleDefinition = Readonly<{
  lookup: Readonly<StylesLookupTable>;
  ast: Readonly<StyleAst>;
  urlPrefix: string;
}>;

/**
 * A function used to control which selectors should be used
 * @param selector - DEPRECATED
 * @param {StyleSelector} rule - a reference to a rule
 */
export type SelectionFilter = {
  (selector: string, rule: StyleSelector): boolean;
  /**
   * Class discovery helper
   * @see {@link https://github.com/theKashey/used-styles/issues/30}
   * @internal
   */
  introduceClasses?(classes: string[]): void;
};
