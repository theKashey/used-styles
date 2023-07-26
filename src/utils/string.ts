import memoizeOne from 'memoize-one';

import { isReact } from '../config';

const memoizedArray = memoizeOne((...args: string[]): string[] => args);

export const getStylesInText = (html: string): string[] =>
  memoizedArray(...(isReact() ? getStylesInReactText(html) : getStylesInPlainText(html)));

export const getStylesInPlainText = (html: string): string[] =>
  [...(html.match(/class=["']([^"]+)["']/g) || []), ...(html.match(/class=([^"'\s>]+)/g) || [])].map((className) =>
    className.replace(/(class|'|"|=)+/g, '')
  );

const classPlaceholder = 'class="';
const classPlaceholderLength = classPlaceholder.length;

export const getStylesInReactText = (html: string): string[] =>
  [...(html.match(/class="([^"]+)"/g) || [])].map((className) =>
    className.substr(classPlaceholderLength, className.length - classPlaceholderLength - 1)
  );

// ----

export const findLastBrace = (str: string): number => {
  let fromIndex = 0;

  while (true) {
    const classNamePosition = str.indexOf('class=', fromIndex);
    const endBrace = str.indexOf('>', Math.max(classNamePosition, fromIndex + 1)) + 1;

    if (endBrace === 0) {
      break;
    }

    fromIndex = Math.max(classNamePosition, endBrace);
  }

  return fromIndex;
};

export const flattenClasses = (classes: string[]): string[] => {
  const result = new Set<string>();

  for (const cls of classes) {
    if (cls.includes(' ')) {
      cls.split(' ').forEach((cl) => result.add(cl));
    } else {
      result.add(cls);
    }
  }

  return Array.from(result.values());
};
