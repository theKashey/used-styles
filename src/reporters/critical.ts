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

function getClosingTag(tag: string): string {
  return `</${tag}>`;
}

export const createCriticalStyleStream = (def: StyleDefinition) => {
  const line = createLine();
  let injections: Array<string | undefined> = [];
  const contentBuffer: string[] = [];
  let bufferUntil: string | null = null;
  let flushContentBuffer = false;

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
      flushContentBuffer = false;

      if (tick === 0) {
        const staticStyles = extractAllUnmatchableAsString(def);
        staticStyles && injections.push(staticStyles);
      }

      tick++;

      const chunkData = process(chunk.toString('utf-8'), line, styleCallback);

      const injectionsBlock = injections.join('');

      if (bufferUntil) {
        const closingTagIndex = chunkData.indexOf(bufferUntil);

        if (closingTagIndex !== -1) {
          // tag was closed, we can flush the buffer
          flushContentBuffer = true;
          bufferUntil = null;
        } else {
          // tag was still not closed yet, buffer the whole chunk.
          contentBuffer.push(chunkData);

          return;
        }
      }

      // protection from chunks with elements that can't contain styles
      // currently supported tags: 'script', 'style', 'select'.
      // parsing with regex should be good enough, or should we use a proper parser?
      const hasOpenedPureTagMatch = chunkData.match(
        /<(style)\b[^>]*>(?:(?!<\/style>)[\s\S])*$|<(script)\b[^>]*>(?:(?!<\/script>)[\s\S])*$|<(select)\b[^>]*>(?:(?!<\/select>)[\s\S])*$/i
      );

      if (!hasOpenedPureTagMatch) {
        if (flushContentBuffer) {
          // inject into the beginning of the chunk and flush buffered content
          _callback(undefined, injectionsBlock + contentBuffer.join() + chunkData);

          contentBuffer.length = 0;
        } else {
          // inject into the beginning of the chunk
          _callback(undefined, injectionsBlock + chunkData);
        }

        return;
      }

      // we are in the middle of a pure tag.
      // we need to wait with style injection until the tag is closed.
      const contentBeforePureTag = chunkData.substring(0, hasOpenedPureTagMatch.index);
      const contentAfterPureTag = chunkData.substring(hasOpenedPureTagMatch.index as number);

      if (flushContentBuffer) {
        // inject into the beginning of the chunk and flush buffered content
        _callback(undefined, injectionsBlock + contentBuffer.join() + contentBeforePureTag);

        contentBuffer.length = 0;
      } else {
        // inject into the beginning of the chunk
        _callback(undefined, injectionsBlock + contentBeforePureTag);
      }

      contentBuffer.push(contentAfterPureTag);
      bufferUntil = getClosingTag(hasOpenedPureTagMatch[1] || hasOpenedPureTagMatch[2] || hasOpenedPureTagMatch[3]);
    },
    flush(flushCallback) {
      flushCallback(undefined, line.tail);
    },
  });
};
