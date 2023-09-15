import { CodeLocation } from './ranges';

export interface StyleRule {
  prop: string;
  value: string;
  important: boolean;
}

export interface ProcessedAtRule {
  kind: 'media' | 'layer';
  value: string;
}

export interface StyleSelector {
  selector: string;
  postfix: string;

  pieces: string[];
  atrules: ProcessedAtRule[];
  parents?: string[];

  declaration: number;
  hash: string;
}

export interface StyleBody {
  id: number;
  rules: StyleRule[];
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
