// @ts-ignore
import * as crc32 from 'crc-32';
import * as postcss from 'postcss';
import { AtRule, Rule } from 'postcss';

import { splitSelector } from '../utils/split-selectors';
import { AtRules, SingleStyleAst, StyleBodies, StyleBody, StyleSelector, ProcessedAtRule } from './ast';
import { createRange, localRangeMax, localRangeMin, rangesIntervalEqual } from './ranges';
import { extractParents, mapSelector } from './utils';

const isCascadeLayerStyles = (rule: AtRule) => {
  /**
   * This detects cases like `@layer something { ... }`,
   * but not the cases of layers order definition like `@layer a, b, c;`
   */
  return rule.name === 'layer' && rule.nodes;
};

/**
 * There are few cases of @-rules, which are getting special processing,
 * like `@media` and `@layer` (cascade layer styles order definition).
 *
 * Any other kind of @-rule is not processed and is just passed to critical css as is.
 */
const getProcessedAtRule = (rule: AtRule | Rule): ProcessedAtRule[] => {
  const parent = rule.parent as AtRule;

  if (parent && (parent.name === 'media' || parent.name === 'layer')) {
    return getProcessedAtRule(parent as any).concat({ value: parent.params, kind: parent.name });
  }

  return [];
};

const getBreak = (rule: string) => {
  const breakPoints = [
    rule.indexOf(' '),
    rule.indexOf('>'),
    rule.indexOf('~'),
    rule.indexOf('+'),
    rule.indexOf(':'),
  ].filter((index) => index > 0);

  if (breakPoints.length === 0) {
    return rule.length;
  }

  const min = Math.min(...breakPoints);

  return min ? min : rule.length;
};

const getPostfix = (rule: string) => {
  return rule.substr(getBreak(rule)).trim();
};

let bodyCounter = 1;

const assignBody = (decl: StyleBody, bodies: StyleBodies): StyleBody => {
  const d = Object.values(bodies).find((bodyDecl) => rangesIntervalEqual(bodyDecl, decl));

  if (d) {
    return d;
  }

  decl.id = bodyCounter++;
  bodies[decl.id] = decl;

  return decl;
};

const hashString = (str: string | undefined): string => {
  if (str === undefined) {
    return '';
  }

  return crc32.str(str).toString(32);
};

const hashBody = (body: StyleBody) => {
  return hashString(JSON.stringify(body.rules));
};

export const buildAst = (CSS: string, file = ''): SingleStyleAst => {
  const root = postcss.parse(CSS);
  const selectors: StyleSelector[] = [];
  const unknownAtRules: AtRules = [];

  const bodies: StyleBodies = {};

  const atParents = new Set<any>();

  root.walkAtRules((rule) => {
    if (rule.name === 'charset') {
      return;
    }

    if (rule.name !== 'media' && !isCascadeLayerStyles(rule)) {
      atParents.add(rule);

      unknownAtRules /*[rule.params]*/
        .push({
          kind: rule.name,
          id: rule.params,
          css: rule.toString(),
        });
    }
  });

  root.walkRules((rule) => {
    if (atParents.has(rule.parent)) {
      return;
    }

    const ruleSelectors = splitSelector(rule.selector);

    ruleSelectors
      .map((sel) => sel.trim())
      .forEach((selector) => {
        const stand: StyleSelector = {
          atrules: getProcessedAtRule(rule),
          selector,
          pieces: mapSelector(selector),
          postfix: getPostfix(selector),
          declaration: 0,
          hash: selector,
        };
        const parents = extractParents(selector);

        if (parents.length > 0) {
          stand.parents = parents;
        }

        const delc: StyleBody = {
          id: NaN,
          rules: [],
          start: createRange(Infinity, Infinity),
          end: createRange(0, 0),
        };

        rule.walkDecls(({ prop, value, source, important }) => {
          if (source) {
            delc.start = localRangeMin(delc.start, source.start!);
            delc.end = localRangeMax(delc.end, source.end!);

            delc.rules.push({
              prop,
              value,
              important,
            });
          }
        });

        stand.declaration = assignBody(delc, bodies).id;

        stand.hash = `${selector}${hashBody(delc)}${hashString(stand.postfix)}${hashString(
          stand.atrules.map((rule) => rule.kind + rule.value).join()
        )}`;

        selectors.push(stand);
      });
  });

  return {
    file,
    selectors,
    bodies,
    unknownAtRules,
  };
};
