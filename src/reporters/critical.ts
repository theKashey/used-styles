import { Transform } from 'stream';

import { isReact } from '../config';
import { criticalStylesToString, extractAllUnmatchableAsString } from '../getCSS';
import { CacheLine, StyleDefinition } from '../types';
import { assertIsReady } from '../utils/async';
import { createLine, createUsedFilter } from '../utils/cache';
import { findLastBrace } from '../utils/string';

export const process = (chunk: string, line: CacheLine, callback: (styles: string) => void): string =>
  isReact() ? processReact(chunk, line, callback) : processPlain(chunk, line, callback);

export const processPlain = (chunk: string, line: CacheLine, callback: (styles: string) => void): string => {
  const data = line.tail + chunk;

  const lastBrace = findLastBrace(data);
  const usedString = data.substring(0, lastBrace);

  callback(usedString);

  line.tail = data.substring(lastBrace);

  return usedString;
};

// tslint:disable-next-line:variable-name
export const processReact = (chunk: string, _line: CacheLine, callback: (styles: string) => void): string => {
  callback(chunk);

  return chunk;
};

export const createCriticalStyleStream = (def: StyleDefinition) => {
  const line = createLine();
  let injections: Array<string | undefined> = [];

  const filter = createUsedFilter();

  const styleCallback = (content: string) => {
    const style = criticalStylesToString(content, def, filter);
    style && injections.push(style);
  };

  let tick = 0;

  return new Transform({
    // transform() is called with each chunk of data
    // tslint:disable-next-line:variable-name
    transform(chunk, _, _callback) {
      assertIsReady(def);
      injections = [];

      if (tick === 0) {
        const staticStyles = extractAllUnmatchableAsString(def);
        staticStyles && injections.push(staticStyles);
      }

      tick++;

      const chunkData = process(chunk.toString('utf-8'), line, styleCallback);

      const injectionsBlock = injections.join('');

      // protection from "long" chunks, mostly long inline style tags we might interfere with
      const firstOpeningBrace = chunkData.indexOf('<');
      const styleTag = '</style>';

      if (
        firstOpeningBrace !== -1 &&
        chunkData.substring(firstOpeningBrace, firstOpeningBrace + styleTag.length) === styleTag
      ) {
        // we are in the middle of a style tag.
        // the next injection should only come after the style tag is closed.
        const splitLocation = firstOpeningBrace + styleTag.length;
        const beforeClosingStyleTag = chunkData.substring(0, splitLocation);
        const afterClosingStyleTag = chunkData.substring(splitLocation);
        _callback(undefined, beforeClosingStyleTag + injectionsBlock + afterClosingStyleTag);

        return;
      }

      // inject into the beginning of the chunk
      _callback(undefined, injectionsBlock + chunkData);
    },
    flush(flushCallback) {
      flushCallback(undefined, line.tail);
    },
  });
};
