import {SingleStyleAst, StyleBody, StyleRule, StyleSelector} from "./ast";

let separator = process.env.NODE_ENV === 'production' ? '' : '\n';

export const escapeValue = (value: string, name: string) => {
  if (name == 'content') return value.split('\\').join('\\\\');
  return value;
};

const createDecl = (decl: StyleRule) => (
  decl.prop + ': ' + escapeValue(decl.value, decl.prop) + ';'
);

const declsToString = (rules: StyleRule[]) =>
  rules
    .map(decl => createDecl(decl))
    .join(separator);

const getMedia = ({media}: { media: string[] }) => {
  const prefix: string[] = [];
  const postfix: string[] = [];

  media.forEach(media => {
    prefix.push(`@media ${media} {`);
    postfix.push('}');
  });
  return [
    prefix.join(separator),
    postfix.join(separator),
  ]
};


const renderRule = (rule: StyleSelector, style: StyleBody) => (
  `${rule.selector} { ${declsToString(style.rules)} }`
);

const isMatching = (selector: string, rule: StyleSelector) => (
  rule.pieces.some(piece => piece === selector)
);

const findMatchingSelectors = (selector: string, selectors: StyleSelector[]): StyleSelector[] => (
  selectors.filter(rule => isMatching(selector, rule))
);

export const fromAst = (rules: string[], {selectors, bodies}: SingleStyleAst, filter?: (selector: string) => boolean) => {

  const blocks: StyleSelector[] = [];

  rules.forEach(rule => {
    blocks.push(
      ...findMatchingSelectors(rule, selectors)
        .filter(block => !filter || filter(block.selector))
    );
  });

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