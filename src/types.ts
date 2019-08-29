import {AST} from "./parser/ast";

export type StylesLookupTable = Record<string, string[]>;

export interface CacheLine {
  tail: string;
}

export interface StyleFile {
  file: string;
  content: string;
}

export type StyleDef = Record<string, Record<string, boolean>>;
export type UsedTypes = string[];
export type UsedTypesRef = Record<string, boolean>;


export interface StyleDefinition {
  lookup: StylesLookupTable;
  ast: AST;
}