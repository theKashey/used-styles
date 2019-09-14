import {CacheLine, StyleDefinition} from "./types";
import {isReact} from "./config";
import {memoizeOne} from './memoize-one';

export const findLastBrace = (data: string): number => {
  let fromIndex = 0;
  while (true) {
    const classNamePosition = data.indexOf('class=', fromIndex);
    const endBrace = data.indexOf('>', Math.max(classNamePosition, fromIndex + 1)) + 1;
    if (endBrace === 0) {
      break;
    }
    fromIndex = Math.max(classNamePosition, endBrace);
  }
  return fromIndex;
};

export const createLine = (): CacheLine => ({
  tail: '',
});

export function unique<T extends any[]>(data: T): T {
  return Array.from(new Set<any>(data)) as T;
}

// ------

const memoizedArray = memoizeOne((...args: string[]): string[] => args);

export const getStylesInText = (str: string): string[] => (
  memoizedArray(
    ...isReact()
      ? getStylesInReactText(str)
      : getStylesInPlainText(str)
  )
);

export const getStylesInPlainText = (str: string): string[] => (
  [
    ...(str.match(/class=["']([^"]+)["']/g) || []),
    ...(str.match(/class=([^"'\s>]+)/g) || []),
  ].map((className) => (
    className.replace(/(class|'|"|=)+/g, '')
  ))
);

const classPlaceholder = 'class="';
const classPlaceholderLength = classPlaceholder.length;

export const getStylesInReactText = (str: string): string[] => (
  [
    ...(str.match(/class="([^"]+)"/g) || []),
  ].map((className) => (
    className.substr(classPlaceholderLength, className.length - classPlaceholderLength - 1)
  ))
);

// -----

export const assertIsReady = (def: StyleDefinition) => {
  if (!def.isReady) {
    throw new Error('used-styles: style definitions are not ready yet. You should `await discoverProjectStyles(...)`');
  }
};