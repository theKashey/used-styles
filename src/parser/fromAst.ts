import { kashe } from 'kashe';
import * as postcss from 'postcss';
import { SingleStyleAst, StyleBody, StyleRule, StyleSelector } from './ast';

const separator = process.env.NODE_ENV === 'production' ? '' : '\n';

export const escapeValue = (value: string, name: string) => {
  if (name === 'content') {
    return value.split('\\').join('\\\\');
  }
  return value;
};

const createDecl = (decl: StyleRule) => postcss.decl(decl) + ';';

const declsToString = (rules: StyleRule[]) => rules.map(decl => createDecl(decl)).join(separator);

const getMedia = ({ media }: { media: string[] }) => {
  const prefix: string[] = [];
  const postfix: string[] = [];

  media.forEach(currentMedia => {
    prefix.push(`@media ${currentMedia} {`);
    postfix.push('}');
  });
  return [prefix.join(separator), postfix.join(separator)];
};

type SelectorLookUp = Set<string>;

const renderRule = kashe(
  (rule: StyleSelector, style: StyleBody) => `${rule.selector} { ${declsToString(style.rules)} }`
);

const isMatching = (rule: StyleSelector, rules: SelectorLookUp) =>
  rule.pieces.length > 0 && rule.pieces.every(piece => rules.has(piece));

const findMatchingSelectors = (rules: SelectorLookUp, selectors: StyleSelector[]): StyleSelector[] =>
  selectors.filter(rule => isMatching(rule, rules));

const findUnmatchableSelectors = (selectors: StyleSelector[]): StyleSelector[] =>
  selectors.filter(rule => rule.pieces.length === 0);

export const fromAst = (rules: string[], def: SingleStyleAst, filter?: (selector: string) => boolean) => {
  const blocks: StyleSelector[] = [];
  const lookup: SelectorLookUp = new Set(rules);

  blocks.push(...findMatchingSelectors(lookup, def.selectors).filter(block => !filter || filter(block.selector)));

  return convertToString(blocks, def);
};

export const getUnmatchableRules = (def: SingleStyleAst, filter?: (selector: string) => boolean): StyleSelector[] =>
  findUnmatchableSelectors(def.selectors).filter(block => !filter || filter(block.selector));

export const extractUnmatchable = (def: SingleStyleAst, filter?: (selector: string) => boolean) =>
  convertToString(getUnmatchableRules(def, filter), def) + getAtRules(def);

const getAtRules = (def: SingleStyleAst) => def.atRules.reduce((acc, rule) => acc + rule.css, '');

export const convertToString = (blocks: StyleSelector[], { bodies }: SingleStyleAst) => {
  blocks.sort((ruleA, ruleB) => bodies[ruleA.declaration].id - bodies[ruleB.declaration].id);

  const result: string[] = [];

  let lastMedia = ['', ''];
  blocks.forEach((block, index) => {
    const media = getMedia(block);
    if (media[0] !== lastMedia[0]) {
      result.push(lastMedia[1]);
      lastMedia = media;
      result.push(lastMedia[0]);
    }
    if (index < blocks.length - 1 && block.declaration === blocks[index + 1].declaration) {
      result.push(`${block.selector},`);
    } else {
      result.push(renderRule(block, bodies[block.declaration]));
    }
  });
  result.push(lastMedia[1]);

  return result.join(separator);
};
