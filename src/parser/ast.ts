import {CodeLocation} from "./ranges";

export interface StyleRule {
  prop: string;
  value: string;
  important: boolean;
}

export interface StyleSelector {
  selector: string;
  postfix: string;

  pieces: string[];
  media: string[];

  declaration: number;
}

export interface StyleBody {
  id: number;
  rules: Array<StyleRule>;
  start: CodeLocation;
  end: CodeLocation;
}

export type StyleBodies = Record<number, StyleBody>;

export interface AtRule {
  kind: string;
  id: string;
  css: string;
}

export type AtRules = AtRule[];

export interface SingleStyleAst {
  file: string;
  selectors: StyleSelector[];
  bodies: StyleBodies;
  atRules: AtRules;
}

export type StyleAst = Record<string, SingleStyleAst>;