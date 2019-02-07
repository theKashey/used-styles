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
