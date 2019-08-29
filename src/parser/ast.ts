import {CodeLocation} from "./ranges";

export interface StyleRule {
  prop: string;
  value: string;
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

export interface AST {
  selectors: StyleSelector[];
  bodies: StyleBodies;
}