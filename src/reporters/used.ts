import { Transform } from 'stream';
import { isReact } from '../config';
import { getUsedStyles } from '../getCSS';
import { CacheLine, StyleDefinition, UsedTypes } from '../types';
import { assertIsReady } from '../utils/async';
import { createLine } from '../utils/cache';
import { findLastBrace } from '../utils/string';

export const process = (
  chunk: string,
  line: CacheLine,
  def: StyleDefinition,
  callback: (styles: UsedTypes) => void
): string => (isReact() ? processReact(chunk, line, def, callback) : processPlain(chunk, line, def, callback));

export const processPlain = (
  chunk: string,
  line: CacheLine,
  def: StyleDefinition,
  callback: (styles: UsedTypes) => void
): string => {
  const data = line.tail + chunk;

  const lastBrace = findLastBrace(data);
  const usedString = data.substring(0, lastBrace);

  callback(getUsedStyles(usedString, def));

  line.tail = data.substring(lastBrace);
  return usedString;
};

export const processReact = (
  chunk: string,
  // tslint:disable-next-line:variable-name
  _line: CacheLine,
  def: StyleDefinition,
  callback: (styles: UsedTypes) => void
): string => {
  callback(getUsedStyles(chunk, def));

  return chunk;
};

export const createStyleStream = (def: StyleDefinition, callback: (styleFile: string) => string | undefined | void) => {
  const line = createLine();
  const styles: Record<string, boolean> = {};
  let injections: Array<string | undefined> = [];

  const cb = (newStyles: UsedTypes) => {
    newStyles.forEach(style => {
      if (!styles[style]) {
        styles[style] = true;
        const result = callback(style);
        if (result) {
          injections.push(result);
        }
      }
    });
  };

  return new Transform({
    // transform() is called with each chunk of data
    // tslint:disable-next-line:variable-name
    transform(chunk, _, _callback) {
      assertIsReady(def);
      injections = [];
      const chunkData = Buffer.from(process(chunk.toString('utf-8'), line, def, cb), 'utf-8');
      _callback(undefined, injections.filter(Boolean).join('\n') + chunkData);
    },

    flush(flushCallback) {
      flushCallback(undefined, line.tail);
    },
  });
};
